import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Minus, RotateCcw, Coins, Settings, ArrowLeft, DollarSign, UserX } from 'lucide-react';
import { usePokerGame } from '@/hooks/usePokerGame';
import { useAuth } from '@/hooks/useAuth';
import TransactionControls from './TransactionControls';
import PlayerCard from './PlayerCard';

const PokerTracker = () => {
  const {
    isDealer,
    showCodeInput,
    showAccessButton,
    accessCode,
    setAccessCode,
    handleAccessCode,
    switchToViewer,
    showCodeInputForm,
    hideCodeInputForm
  } = useAuth();

  const {
    players,
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
    toast
  } = usePokerGame(isDealer);

  const handleBet = (playerId: string, amount: number) => {
    const player = players.find(p => p.id === playerId);
    if (!player || player.balance < amount) {
      toast({
        title: "Insufficient Funds",
        description: "Player doesn't have enough money for this bet",
        variant: "destructive"
      });
      return;
    }

    addTransaction(playerId, amount, 'bet', `Bet ${amount}`);
    toast({
      title: "Bet Placed",
      description: `${player.name} bet ${amount}`,
    });
  };

  const handleWin = (playerId: string, amount: number) => {
    if (bankBalance < amount) {
      toast({
        title: "Insufficient Bank Funds",
        description: "Bank doesn't have enough money for this payout",
        variant: "destructive"
      });
      return;
    }

    const player = players.find(p => p.id === playerId);
    addTransaction(playerId, amount, 'win', `Won ${amount}`);
    toast({
      title: "Payout Made",
      description: `${player?.name} won ${amount}`,
    });
  };

  const handleAddMoney = (playerId: string, amount: number) => {
    const player = players.find(p => p.id === playerId);
    addTransaction(playerId, amount, 'add', `Added ${amount}`);
    toast({
      title: "Money Added",
      description: `Added ${amount} to ${player?.name}`,
    });
  };

  if (showCodeInput) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="poker-table p-8 max-w-md w-full">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold text-primary">FuntimePoker with Friends</h1>
            <div className="space-y-4">
              <Label htmlFor="access-code">Enter Access Code</Label>
              <Input
                id="access-code"
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter code"
                className="bg-forest-light border-primary/30"
              />
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleAccessCode} className="w-full">
                  Access Game
                </Button>
                <Button onClick={hideCodeInputForm} variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary flex items-center justify-center gap-2">
            <Coins className="h-8 w-8" />
            FuntimePoker with Friends
          </h1>
          <p className="text-muted-foreground">Digital poker table - synced via Airtable</p>
          <div className="flex justify-center gap-2">
            <Badge variant={isDealer ? "default" : "secondary"}>
              {isDealer ? "Dealer Mode" : "Viewer Mode"}
            </Badge>
            {gameStarted && <Badge variant="outline">Round {currentRound}</Badge>}
            {isDealer && (
              <Button onClick={switchToViewer} variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Switch to Viewer
              </Button>
            )}
          </div>
        </div>

        {/* Bank */}
        <Card className="p-6 poker-table">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-primary">Bank</h3>
            <div className="chip-stack rounded-lg p-4">
              <div className="text-3xl font-bold text-forest-dark">
                {bankBalance}
              </div>
            </div>
            <div className="flex justify-center gap-4 text-sm text-muted-foreground">
              <span>Small Blind: {smallBlind}</span>
              <span>Big Blind: {bigBlind}</span>
              {highestBet > 0 && <span>Highest Bet: {highestBet}</span>}
            </div>
          </div>
        </Card>

        {/* Transaction Controls */}
        {isDealer && (
          <TransactionControls
            players={players}
            gameStarted={gameStarted}
            onBet={handleBet}
            onWin={handleWin}
            onAddMoney={handleAddMoney}
            onFold={foldPlayer}
            onUnfold={unfoldPlayer}
            onMatchBet={matchBet}
            onStartGame={startGame}
            onSelectedPlayerChange={setSelectedPlayerId}
          />
        )}

        {/* Players Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => {
            const isPlayerDealer = activePlayers.findIndex(p => p.id === player.id) === dealerPosition;
            const isSmallBlind = activePlayers.findIndex(p => p.id === player.id) === smallBlindIndex;
            const isBigBlind = activePlayers.findIndex(p => p.id === player.id) === bigBlindIndex;
            const isSelected = player.id === selectedPlayerId;

            return (
              <PlayerCard
                key={player.id}
                player={player}
                isDealer={isDealer}
                isPlayerDealer={isPlayerDealer}
                isSmallBlind={isSmallBlind}
                isBigBlind={isBigBlind}
                startingMoney={startingMoney}
                highestBet={highestBet}
                isSelected={isSelected}
                onUpdateName={updatePlayerName}
                onToggleActive={togglePlayerActive}
              />
            );
          })}
        </div>

        {/* Game Setup */}
        {isDealer && (
          <Card className="poker-table p-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-primary">Game Setup</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                  <Label htmlFor="starting-money">Starting Money</Label>
                  <Input
                    id="starting-money"
                    type="number"
                    value={startingMoney}
                    onChange={(e) => setStartingMoney(parseInt(e.target.value) || 100)}
                    className="bg-forest-light border-primary/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="small-blind">Small Blind</Label>
                  <Input
                    id="small-blind"
                    type="number"
                    value={smallBlind}
                    onChange={(e) => setSmallBlind(parseInt(e.target.value) || 5)}
                    className="bg-forest-light border-primary/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="big-blind">Big Blind</Label>
                  <Input
                    id="big-blind"
                    type="number"
                    value={bigBlind}
                    onChange={(e) => setBigBlind(parseInt(e.target.value) || 10)}
                    className="bg-forest-light border-primary/30"
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Game
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Game?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reset all active player balances to the starting money amount and clear all transactions. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={resetGame}>
                        Reset Game
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        )}

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <Card className="p-6 poker-table">
            <h3 className="text-xl font-bold text-primary mb-4">Recent Transactions</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactions.map((transaction) => {
                const player = players.find(p => p.id === transaction.playerId);
                return (
                  <div key={transaction.id} className="flex justify-between items-center p-3 bg-forest-light rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        transaction.type === 'bet' ? 'destructive' : 
                        transaction.type === 'add' ? 'secondary' : 
                        transaction.type === 'fold' ? 'outline' : 'default'
                      }>
                        {transaction.type === 'bet' ? <Minus className="h-3 w-3" /> : 
                         transaction.type === 'add' ? <DollarSign className="h-3 w-3" /> :
                         transaction.type === 'fold' ? <UserX className="h-3 w-3" /> :
                         <Plus className="h-3 w-3" />}
                      </Badge>
                      <span className="font-medium">{player?.name}</span>
                      <span className="text-muted-foreground">{transaction.description}</span>
                    </div>
                    <div className={`font-bold ${
                      transaction.type === 'bet' ? 'text-destructive' : 
                      transaction.type === 'fold' ? 'text-muted-foreground' : 'text-primary'
                    }`}>
                      {transaction.type === 'bet' ? `-$${transaction.amount}` : 
                       transaction.type === 'fold' ? 'FOLD' : `+$${transaction.amount}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Access Button for Viewers */}
        {!isDealer && showAccessButton && (
          <div className="flex justify-center">
            <Button onClick={showCodeInputForm} variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Become Dealer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PokerTracker;
