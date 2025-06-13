
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Crown, UserX, UserCheck, Sparkles, Zap, X } from 'lucide-react';
import { Player } from '@/hooks/usePokerGame';

interface PlayerCardProps {
  player: Player;
  isDealer: boolean;
  isPlayerDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  startingMoney: number;
  highestBet: number;
  isSelected?: boolean;
  onUpdateName: (playerId: string, newName: string) => void;
  onToggleActive: (playerId: string) => void;
}

const PlayerCard = ({ 
  player, 
  isDealer, 
  isPlayerDealer, 
  isSmallBlind, 
  isBigBlind, 
  startingMoney, 
  highestBet,
  isSelected = false,
  onUpdateName, 
  onToggleActive 
}: PlayerCardProps) => {
  const getBalanceColor = (balance: number) => {
    if (balance <= 0) return 'text-yellow-500 font-bold'; // Highlighted for zero/negative
    if (balance > startingMoney) return 'text-primary';
    if (balance < 0) return 'text-destructive';
    return 'text-foreground';
  };

  const getBetStatus = () => {
    if (!player.isActive || player.currentBet === 0 || player.hasFolded) return null;
    
    if (player.currentBet === highestBet) {
      return 'Called';
    } else if (player.currentBet < highestBet) {
      const toCall = highestBet - player.currentBet;
      return `To call: ${toCall}`;
    }
    return 'In';
  };

  // Determine the border/ring styling based on conditions
  const getCardStyling = () => {
    let classes = 'p-4 poker-table transition-all ';
    
    // Base opacity for inactive/folded players
    if (!player.isActive) {
      classes += 'opacity-50 ';
    } else if (player.hasFolded) {
      classes += 'opacity-60 border-destructive ';
    }
    
    // Blue highlight for zero/negative balance (always present when in debt)
    if (player.balance <= 0 && player.isActive) {
      classes += 'ring-4 ring-blue-500 border-blue-500 ';
    }
    // Orange highlight for selected player (overrides blue if both conditions are true)
    else if (isSelected) {
      classes += 'ring-4 ring-orange-500 border-orange-500 ';
    }
    
    return classes;
  };

  return (
    <Card className={getCardStyling()}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Input
            value={player.name}
            onChange={(e) => onUpdateName(player.id, e.target.value)}
            className="bg-forest-light border-primary/30 text-lg font-semibold"
            disabled={!isDealer}
          />
          {isDealer && (
            <Button
              variant={player.isActive ? "destructive" : "secondary"}
              size="sm"
              onClick={() => onToggleActive(player.id)}
            >
              {player.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            </Button>
          )}
        </div>
        
        <div className="text-center space-y-2">
          <div className={`text-3xl font-bold ${getBalanceColor(player.balance)}`}>
            {player.balance}
          </div>
          
          {/* Current Bet Display */}
          {player.isActive && player.currentBet > 0 && !player.hasFolded && (
            <div className="bg-forest-medium p-2 rounded-lg">
              <div className="text-sm text-muted-foreground">Current Bet</div>
              <div className="text-xl font-bold text-primary">{player.currentBet}</div>
              {getBetStatus() && (
                <div className="text-xs text-muted-foreground">{getBetStatus()}</div>
              )}
            </div>
          )}
          
          <div className="flex flex-wrap gap-1 justify-center">
            {isPlayerDealer && player.isActive && !player.hasFolded && (
              <Badge className="bg-gold text-forest-dark">
                <Crown className="h-3 w-3 mr-1" />
                Dealer
              </Badge>
            )}
            {isSmallBlind && player.isActive && !player.hasFolded && (
              <Badge variant="outline" className="border-blue-400 text-blue-400 bg-blue-400/10">
                <Sparkles className="h-3 w-3 mr-1" />
                Small Blind
              </Badge>
            )}
            {isBigBlind && player.isActive && !player.hasFolded && (
              <Badge variant="outline" className="border-orange-400 text-orange-400 bg-orange-400/10">
                <Zap className="h-3 w-3 mr-1" />
                Big Blind
              </Badge>
            )}
            {player.hasFolded && player.isActive && (
              <Badge variant="destructive">
                <X className="h-3 w-3 mr-1" />
                Folded
              </Badge>
            )}
            {!player.isActive && (
              <Badge variant="secondary">Disabled</Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PlayerCard;
