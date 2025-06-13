import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Minus, Crown, DollarSign, Sparkles, UserX, CheckCircle, Play, RotateCcw } from 'lucide-react';
import { Player } from '@/hooks/usePokerGame';

interface TransactionControlsProps {
  players: Player[];
  gameStarted: boolean;
  onBet: (playerId: string, amount: number) => void;
  onWin: (playerId: string, amount: number) => void;
  onAddMoney: (playerId: string, amount: number) => void;
  onFold: (playerId: string) => void;
  onUnfold: (playerId: string) => void;
  onMatchBet: (playerId: string) => void;
  onStartGame: () => void;
  onSelectedPlayerChange?: (playerId: string) => void;
}

const TransactionControls = ({ 
  players, 
  gameStarted,
  onBet, 
  onWin, 
  onAddMoney, 
  onFold,
  onUnfold,
  onMatchBet,
  onStartGame,
  onSelectedPlayerChange
}: TransactionControlsProps) => {
  const [betAmount, setBetAmount] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');

  // Get active, non-folded players for auto-selection
  const getEligiblePlayers = () => {
    return players.filter(p => p.isActive && !p.hasFolded);
  };

  // Get all active players (including folded) for manual selection
  const getAllActivePlayers = () => {
    return players.filter(p => p.isActive);
  };

  // Auto-select next eligible player (only for non-folded)
  const selectNextPlayer = () => {
    const eligiblePlayers = getEligiblePlayers();
    if (eligiblePlayers.length === 0) return;

    const currentIndex = eligiblePlayers.findIndex(p => p.id === selectedPlayer);
    const nextIndex = (currentIndex + 1) % eligiblePlayers.length;
    setSelectedPlayer(eligiblePlayers[nextIndex].id);
  };

  // Initialize with first eligible player
  useEffect(() => {
    if (!selectedPlayer) {
      const eligiblePlayers = getEligiblePlayers();
      if (eligiblePlayers.length > 0) {
        setSelectedPlayer(eligiblePlayers[0].id);
      }
    }
  }, [players, selectedPlayer]);

  // Update selected player if current one becomes inactive (but allow folded players to stay selected)
  useEffect(() => {
    const allActivePlayers = getAllActivePlayers();
    const currentPlayerActive = allActivePlayers.some(p => p.id === selectedPlayer);
    
    if (!currentPlayerActive && allActivePlayers.length > 0) {
      const eligiblePlayers = getEligiblePlayers();
      if (eligiblePlayers.length > 0) {
        setSelectedPlayer(eligiblePlayers[0].id);
      }
    }
  }, [players, selectedPlayer]);

  // Notify parent component of selected player changes
  useEffect(() => {
    if (onSelectedPlayerChange) {
      onSelectedPlayerChange(selectedPlayer);
    }
  }, [selectedPlayer, onSelectedPlayerChange]);

  const handlePlayerChange = (playerId: string) => {
    setSelectedPlayer(playerId);
  };

  const handleBet = () => {
    const amount = parseFloat(betAmount);
    if (selectedPlayer && amount > 0) {
      onBet(selectedPlayer, amount);
      setBetAmount('');
      selectNextPlayer();
    }
  };

  const handleWin = () => {
    const amount = parseFloat(betAmount);
    if (selectedPlayer && amount > 0) {
      onWin(selectedPlayer, amount);
      setBetAmount('');
      selectNextPlayer();
    }
  };

  const handleAddMoney = () => {
    const amount = parseFloat(betAmount);
    if (selectedPlayer && amount > 0) {
      onAddMoney(selectedPlayer, amount);
      setBetAmount('');
      selectNextPlayer();
    }
  };

  const handleFold = () => {
    if (selectedPlayer) {
      onFold(selectedPlayer);
      selectNextPlayer();
    }
  };

  const handleUnfold = () => {
    if (selectedPlayer) {
      onUnfold(selectedPlayer);
      // Don't auto-select next player after unfolding, keep the same player selected
    }
  };

  const handleMatchBet = () => {
    if (selectedPlayer) {
      onMatchBet(selectedPlayer);
      selectNextPlayer();
    }
  };

  const selectedPlayerObj = players.find(p => p.id === selectedPlayer);
  const isPlayerFolded = selectedPlayerObj && selectedPlayerObj.isActive && selectedPlayerObj.hasFolded;
  const isPlayerActive = selectedPlayerObj && selectedPlayerObj.isActive && !selectedPlayerObj.hasFolded;

  return (
    <Card className="p-6 poker-table">
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-primary">Game Controls</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Player</Label>
            <select
              value={selectedPlayer}
              onChange={(e) => handlePlayerChange(e.target.value)}
              className="w-full p-2 rounded-md bg-forest-light border border-primary/30 text-foreground"
            >
              <option value="">Select Player</option>
              {getAllActivePlayers().map(player => (
                <option key={player.id} value={player.id}>
                  {player.name} {player.hasFolded ? '(Folded)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="0"
              className="bg-forest-light border-primary/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          <Button onClick={handleBet} variant="destructive" className="w-full" disabled={isPlayerFolded}>
            <Minus className="h-4 w-4 mr-2" />
            Bet
          </Button>
          <Button onClick={handleMatchBet} className="w-full bg-green-700 hover:bg-green-800 text-white" disabled={isPlayerFolded}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Match Bet
          </Button>
          {isPlayerFolded ? (
            <Button onClick={handleUnfold} className="w-full bg-blue-700 hover:bg-blue-800 text-white">
              <RotateCcw className="h-4 w-4 mr-2" />
              Unfold
            </Button>
          ) : (
            <Button onClick={handleFold} className="w-full bg-red-800 hover:bg-red-900 text-white" disabled={!isPlayerActive}>
              <UserX className="h-4 w-4 mr-2" />
              Fold
            </Button>
          )}
          <Button onClick={handleAddMoney} variant="secondary" className="w-full" disabled={isPlayerFolded}>
            <DollarSign className="h-4 w-4 mr-2" />
            Add Money
          </Button>
          <Button onClick={handleWin} className="w-full" disabled={isPlayerFolded}>
            <Plus className="h-4 w-4 mr-2" />
            Win
          </Button>
          <Button onClick={onStartGame} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
            {gameStarted ? (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Next Round
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Game
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TransactionControls;
