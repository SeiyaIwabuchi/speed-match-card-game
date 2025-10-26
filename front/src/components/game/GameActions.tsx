import React from 'react';
import { Button, Card } from '../ui';

export interface GameActionsProps {
  onDrawCard?: () => void;
  onSkipTurn?: () => void;
  canDrawCard: boolean;
  canSkipTurn: boolean;
  isPlayerTurn: boolean;
  isLoading?: boolean;
  className?: string;
}

const GameActions: React.FC<GameActionsProps> = ({
  onDrawCard,
  onSkipTurn,
  canDrawCard,
  canSkipTurn,
  isPlayerTurn,
  isLoading = false,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <Card variant="elevated" className="p-6">
        <h3 className="text-lg font-bold mb-4">アクション</h3>

        {!isPlayerTurn ? (
          <p className="text-secondary">他のプレイヤーのターンです</p>
        ) : (
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="primary"
              onClick={onDrawCard}
              disabled={!canDrawCard || isLoading}
              loading={isLoading}
              className="flex-1 min-w-0"
            >
              カードを引く
            </Button>

            <Button
              variant="secondary"
              onClick={onSkipTurn}
              disabled={!canSkipTurn || isLoading}
              loading={isLoading}
              className="flex-1 min-w-0"
            >
              スキップ
            </Button>
          </div>
        )}

        <div className="mt-4 text-sm text-secondary">
          <p>• カードを引く: 山札から1枚引きます</p>
          <p>• スキップ: ターンをスキップします</p>
        </div>
      </Card>
    </div>
  );
};

export default GameActions;