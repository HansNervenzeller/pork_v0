import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Player } from './usePokerGame';

const AIRTABLE_API_TOKEN = 'pat0PPfnTjGoBAs8x.c808f42667e709a0d49fe3a2885d5cf90cbaf2bb43fce170a9c4a3cf1d01a963';
const AIRTABLE_BASE_URL = 'https://api.airtable.com/v0/appu6GAiYexnUh0n6/tblTRiOimnXWigDmM';

interface AirtableRecord {
  id: string;
  fields: {
    player_id: string;
    name: string;
    balance: number;
    current_bet: number;
    is_active: boolean;
    has_folded: boolean;
    status: string;
    is_selected: boolean;
    game_round: number;
    highest_bet: number;
    starting_money: number;
    small_blind_amount: number;
    big_blind_amount: number;
    game_started: boolean;
    last_updated: string;
  };
}

interface GameState {
  players: Player[];
  selectedPlayerId: string;
  gameRound: number;
  highestBet: number;
  startingMoney: number;
  smallBlind: number;
  bigBlind: number;
  gameStarted: boolean;
}

export const useAirtable = (isDealer: boolean) => {
  const [records, setRecords] = useState<AirtableRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const pendingGameStateRef = useRef<GameState | null>(null);
  const lastSyncTimeRef = useRef<number>(0);

  const headers = {
    'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`,
    'Content-Type': 'application/json'
  };

  // Fetch data from Airtable
  const fetchFromAirtable = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Fetching from Airtable...', AIRTABLE_BASE_URL);
      const response = await fetch(AIRTABLE_BASE_URL, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Airtable fetch error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Airtable fetch success:', data);
      setRecords(data.records || []);
      return data.records || [];
    } catch (error) {
      console.error('Error fetching from Airtable:', error);
      if (isDealer) {
        toast({
          title: "Sync Error",
          description: `Failed to fetch data from Airtable: ${error}`,
          variant: "destructive"
        });
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isDealer, toast]);

  // Push data to Airtable (dealer only) - now stores pending state for batched sync
  const pushToAirtable = useCallback(async (gameState: GameState) => {
    if (!isDealer) return;

    // Store the latest game state for batched syncing
    pendingGameStateRef.current = gameState;
  }, [isDealer]);

  // Actual sync function that sends data to Airtable
  const syncToAirtable = useCallback(async () => {
    if (!isDealer || !pendingGameStateRef.current) return;

    const gameState = pendingGameStateRef.current;
    pendingGameStateRef.current = null; // Clear pending state

    try {
      console.log('Syncing to Airtable...', gameState);
      const recordsToUpdate = gameState.players.map((player, index) => {
        const dealerIndex = gameState.players.filter(p => p.isActive).findIndex((_, i) => i === 0); // Simplified for now
        const isPlayerDealer = gameState.players.filter(p => p.isActive).findIndex(p => p.id === player.id) === dealerIndex;
        const smallBlindIndex = (dealerIndex + 1) % gameState.players.filter(p => p.isActive).length;
        const bigBlindIndex = (dealerIndex + 2) % gameState.players.filter(p => p.isActive).length;
        const playerIndex = gameState.players.filter(p => p.isActive).findIndex(p => p.id === player.id);
        
        let status = 'normal';
        if (isPlayerDealer) status = 'dealer';
        else if (playerIndex === smallBlindIndex) status = 'small_blind';
        else if (playerIndex === bigBlindIndex) status = 'big_blind';

        return {
          id: records.find(r => r.fields.player_id === player.id)?.id,
          fields: {
            player_id: player.id,
            name: player.name,
            balance: player.balance,
            current_bet: player.currentBet,
            is_active: player.isActive,
            has_folded: player.hasFolded,
            status: status,
            is_selected: player.id === gameState.selectedPlayerId,
            game_round: gameState.gameRound,
            highest_bet: gameState.highestBet,
            starting_money: gameState.startingMoney,
            small_blind_amount: gameState.smallBlind,
            big_blind_amount: gameState.bigBlind,
            game_started: gameState.gameStarted,
            last_updated: new Date().toISOString()
          }
        };
      });

      // Update existing records
      const updatePayload = {
        records: recordsToUpdate.filter(r => r.id).map(r => ({ id: r.id, fields: r.fields }))
      };

      if (updatePayload.records.length > 0) {
        console.log('Updating records:', updatePayload);
        const response = await fetch(AIRTABLE_BASE_URL, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(updatePayload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Airtable update error:', response.status, errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Update success:', result);
        lastSyncTimeRef.current = Date.now();
      }

      // Create new records if needed
      const newRecords = recordsToUpdate.filter(r => !r.id);
      if (newRecords.length > 0) {
        console.log('Creating new records:', newRecords);
        const createPayload = {
          records: newRecords.map(r => ({ fields: r.fields }))
        };

        const response = await fetch(AIRTABLE_BASE_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify(createPayload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Airtable create error:', response.status, errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Create success:', result);
        lastSyncTimeRef.current = Date.now();
      }

    } catch (error) {
      console.error('Error syncing to Airtable:', error);
      toast({
        title: "Sync Error",
        description: `Failed to sync data to Airtable: ${error}`,
        variant: "destructive"
      });
    }
  }, [isDealer, records, headers, toast]);

  // Convert Airtable records to game state
  const getGameStateFromAirtable = useCallback((): GameState | null => {
    if (records.length === 0) return null;

    // Get the most recent record for game settings
    const latestRecord = records.sort((a, b) => 
      new Date(b.fields.last_updated || 0).getTime() - new Date(a.fields.last_updated || 0).getTime()
    )[0];

    const players: Player[] = records
      .sort((a, b) => parseInt(a.fields.player_id) - parseInt(b.fields.player_id))
      .map(record => ({
        id: record.fields.player_id,
        name: record.fields.name || `Player ${record.fields.player_id}`,
        balance: record.fields.balance || 0,
        isActive: record.fields.is_active || false,
        currentBet: record.fields.current_bet || 0,
        hasFolded: record.fields.has_folded || false
      }));

    const selectedPlayerId = records.find(r => r.fields.is_selected)?.fields.player_id || '';

    return {
      players,
      selectedPlayerId,
      gameRound: latestRecord?.fields.game_round || 0,
      highestBet: latestRecord?.fields.highest_bet || 0,
      startingMoney: latestRecord?.fields.starting_money || 100,
      smallBlind: latestRecord?.fields.small_blind_amount || 5,
      bigBlind: latestRecord?.fields.big_blind_amount || 10,
      gameStarted: latestRecord?.fields.game_started || false
    };
  }, [records]);

  // Dealer mode: sync every 3 seconds if there's pending data
  useEffect(() => {
    if (isDealer) {
      const interval = setInterval(() => {
        if (pendingGameStateRef.current) {
          syncToAirtable();
        }
      }, 3000); // Sync every 3 seconds
      return () => clearInterval(interval);
    }
  }, [isDealer, syncToAirtable]);

  // Auto-fetch for viewers every 2 seconds (reduced back to 2 for better responsiveness)
  useEffect(() => {
    if (!isDealer) {
      const interval = setInterval(fetchFromAirtable, 2000);
      return () => clearInterval(interval);
    }
  }, [isDealer, fetchFromAirtable]);

  // Initial fetch
  useEffect(() => {
    fetchFromAirtable();
  }, [fetchFromAirtable]);

  return {
    records,
    isLoading,
    fetchFromAirtable,
    pushToAirtable,
    getGameStateFromAirtable
  };
};
