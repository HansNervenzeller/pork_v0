import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAirtable } from './useAirtable';

export interface Player {
  id: string;
  name: string;
  balance: number;
  isActive: boolean;
  currentBet: number;
  hasFolded: boolean;
}

export interface Transaction {
  id: string;
  playerId: string;
  amount: number;
  type: 'bet' | 'win' | 'add' | 'fold';
  timestamp: Date;
  description: string;
}

export const usePokerGame = (isDealer: boolean) => {
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'Player 1', balance: 0, isActive: true, currentBet: 0, hasFolded: false },
    { id: '2', name: 'Player 2', balance: 0, isActive: true, currentBet: 0, hasFolded: false },
    { id: '3', name: 'Player 3', balance: 0, isActive: true, currentBet: 0, hasFolded: false },
    { id: '4', name: 'Player 4', balance: 0, isActive: true, currentBet: 0, hasFolded: false },
    { id: '5', name: 'Player 5', balance: 0, isActive: true, currentBet: 0, hasFolded: false },
    { id: '6', name: 'Player 6', balance: 0, isActive: true, currentBet: 0, hasFolded: false },
  ]);

  const [bankBalance, setBankBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dealerPosition, setDealerPosition] = useState(0);
  const [startingMoney, setStartingMoney] = useState(100);
  const [smallBlind, setSmallBlind] = useState(5);
  const [bigBlind, setBigBlind] = useState(10);
  const [currentRound, setCurrentRound] = useState(0);
  const [highestBet, setHighestBet] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const { toast } = useToast();

  // Airtable integration
  const { pushToAirtable, getGameStateFromAirtable } = useAirtable(isDealer);

  const activePlayers = players.filter(p => p.isActive);
  
  const smallBlindIndex = (dealerPosition + 1) % activePlayers.length;
  const bigBlindIndex = (dealerPosition + 2) % activePlayers.length;

  // Sync game state to Airtable when dealer makes changes
  useEffect(() => {
    if (isDealer) {
      const gameState = {
        players,
        selectedPlayerId,
        gameRound: currentRound,
        highestBet,
        startingMoney,
        smallBlind,
        bigBlind,
        gameStarted
      };
      pushToAirtable(gameState);
    }
  }, [isDealer, players, selectedPlayerId, currentRound, highestBet, startingMoney, smallBlind, bigBlind, gameStarted, pushToAirtable]);

  // Sync game state from Airtable for viewers
  useEffect(() => {
    if (!isDealer) {
      const gameState = getGameStateFromAirtable();
      if (gameState) {
        setPlayers(gameState.players);
        setSelectedPlayerId(gameState.selectedPlayerId);
        setCurrentRound(gameState.gameRound);
        setHighestBet(gameState.highestBet);
        setStartingMoney(gameState.startingMoney);
        setSmallBlind(gameState.smallBlind);
        setBigBlind(gameState.bigBlind);
        setGameStarted(gameState.gameStarted);
      }
    }
  }, [isDealer, getGameStateFromAirtable]);

  // Fixed bank balance calculation - only count active players
  useEffect(() => {
    const activePlayersTotal = players
      .filter(p => p.isActive)
      .reduce((sum, player) => sum + player.balance, 0);
    const expectedTotal = activePlayers.length * startingMoney;
    const calculatedBankBalance = expectedTotal - activePlayersTotal;
    setBankBalance(calculatedBankBalance);
  }, [players, startingMoney, activePlayers.length]);

  const updatePlayerName = (playerId: string, newName: string) => {
    if (!isDealer) return;
    setPlayers(prev => prev.map(player => 
      player.id === playerId ? { ...player, name: newName } : player
    ));
  };

  // Fixed reset function - only reset active players, clear disabled players' balances
  const resetGame = () => {
    if (!isDealer) return;
    setPlayers(prev => prev.map(player => ({
      ...player,
      balance: player.isActive ? startingMoney : 0,
      currentBet: 0,
      hasFolded: false
    })));
    setTransactions([]);
    setDealerPosition(0);
    setCurrentRound(0);
    setHighestBet(0);
    setGameStarted(false);
    setSelectedPlayerId('');
    toast({
      title: "Game Reset",
      description: `All active players set to ${startingMoney}`,
    });
  };

  const addTransaction = (playerId: string, amount: number, type: 'bet' | 'win' | 'add' | 'fold', description: string) => {
    if (!isDealer) return;
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      playerId,
      amount,
      type,
      timestamp: new Date(),
      description
    };

    setTransactions(prev => [transaction, ...prev].slice(0, 20));

    setPlayers(prev => prev.map(player => {
      if (player.id === playerId) {
        if (type === 'bet') {
          const newCurrentBet = player.currentBet + amount;
          setHighestBet(current => Math.max(current, newCurrentBet));
          return { 
            ...player, 
            balance: player.balance - amount,
            currentBet: newCurrentBet
          };
        } else if (type === 'fold') {
          return { ...player, hasFolded: true };
        } else {
          return { ...player, balance: player.balance + amount };
        }
      }
      return player;
    }));
  };

  const foldPlayer = (playerId: string) => {
    if (!isDealer) return;
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    addTransaction(playerId, 0, 'fold', 'Folded');
    toast({
      title: "Player Folded",
      description: `${player.name} folded`,
    });
  };

  const unfoldPlayer = (playerId: string) => {
    if (!isDealer) return;
    const player = players.find(p => p.id === playerId);
    if (!player || !player.hasFolded) return;

    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, hasFolded: false } : p
    ));

    const transaction: Transaction = {
      id: Date.now().toString(),
      playerId,
      amount: 0,
      type: 'add',
      timestamp: new Date(),
      description: 'Unfolded'
    };

    setTransactions(prev => [transaction, ...prev].slice(0, 20));

    toast({
      title: "Player Unfolded",
      description: `${player.name} is back in the game`,
    });
  };

  const matchBet = (playerId: string) => {
    if (!isDealer) return;
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const amountToCall = highestBet - player.currentBet;
    if (amountToCall <= 0) {
      toast({
        title: "Already Called",
        description: `${player.name} has already matched the current bet`,
        variant: "destructive"
      });
      return;
    }

    if (player.balance < amountToCall) {
      toast({
        title: "Insufficient Funds",
        description: "Player doesn't have enough money to call",
        variant: "destructive"
      });
      return;
    }

    addTransaction(playerId, amountToCall, 'bet', `Called ${amountToCall}`);
    toast({
      title: "Bet Matched",
      description: `${player.name} called ${amountToCall}`,
    });
  };

  const togglePlayerActive = (playerId: string) => {
    if (!isDealer) return;
    setPlayers(prev => prev.map(player => 
      player.id === playerId 
        ? { ...player, isActive: !player.isActive, balance: !player.isActive ? 0 : player.balance, currentBet: 0, hasFolded: false }
        : player
    ));
  };

  // Fixed function to distribute pot among non-folded players
  const distributePot = () => {
    if (!isDealer) return;
    const nonFoldedPlayers = players.filter(p => p.isActive && !p.hasFolded);
    if (nonFoldedPlayers.length === 0) return;

    const totalPot = players
      .filter(p => p.isActive)
      .reduce((sum, player) => sum + player.currentBet, 0);
    
    if (totalPot <= 0) return;

    const amountPerPlayer = Math.floor(totalPot / nonFoldedPlayers.length);
    
    // Distribute the pot
    setPlayers(prev => prev.map(player => {
      if (player.isActive && !player.hasFolded) {
        return { ...player, balance: player.balance + amountPerPlayer };
      }
      return player;
    }));

    // Add transaction for pot distribution
    nonFoldedPlayers.forEach(player => {
      const transaction: Transaction = {
        id: Date.now().toString() + player.id,
        playerId: player.id,
        amount: amountPerPlayer,
        type: 'win',
        timestamp: new Date(),
        description: `Pot share: ${amountPerPlayer}`
      };
      setTransactions(prev => [transaction, ...prev].slice(0, 20));
    });

    toast({
      title: "Pot Distributed",
      description: `${totalPot} split among ${nonFoldedPlayers.length} players (${amountPerPlayer} each)`,
    });
  };

  const startGame = () => {
    if (!isDealer) return;
    if (!gameStarted) {
      setGameStarted(true);
      setCurrentRound(1);
    } else {
      // Distribute pot before starting new round
      distributePot();
      setCurrentRound(prev => prev + 1);
      const newDealerPosition = (dealerPosition + 1) % activePlayers.length;
      setDealerPosition(newDealerPosition);
    }
    
    // Clear current bets, fold status and set blinds automatically
    setPlayers(prev => prev.map((player, index) => {
      const activeIndex = activePlayers.findIndex(p => p.id === player.id);
      const isSmallBlind = activeIndex === ((dealerPosition + 1) % activePlayers.length);
      const isBigBlind = activeIndex === ((dealerPosition + 2) % activePlayers.length);
      
      let newBalance = player.balance;
      let newCurrentBet = 0;
      
      if (player.isActive) {
        if (isSmallBlind) {
          newBalance -= smallBlind;
          newCurrentBet = smallBlind;
        } else if (isBigBlind) {
          newBalance -= bigBlind;
          newCurrentBet = bigBlind;
        }
      }
      
      return {
        ...player,
        currentBet: newCurrentBet,
        balance: newBalance,
        hasFolded: false
      };
    }));
    
    setHighestBet(bigBlind);
    
    const dealerName = gameStarted ? activePlayers[(dealerPosition + 1) % activePlayers.length]?.name : activePlayers[dealerPosition]?.name;
    toast({
      title: gameStarted ? "New Round Started" : "Game Started",
      description: `${gameStarted ? `Round ${currentRound + 1}` : 'Round 1'} - ${dealerName} is dealing`,
    });
  };

  return {
    players,
    setPlayers,
    bankBalance,
    transactions,
    dealerPosition,
    startingMoney,
    setStartingMoney,
    smallBlind,
    setSmallBlind,
    bigBlind,
    setBigBlind,
    currentRound,
    highestBet,
    gameStarted,
    activePlayers,
    smallBlindIndex,
    bigBlindIndex,
    selectedPlayerId,
    setSelectedPlayerId,
    updatePlayerName,
    resetGame,
    addTransaction,
    foldPlayer,
    unfoldPlayer,
    matchBet,
    togglePlayerActive,
    startGame,
    distributePot,
    toast
  };
};
