import React from 'react';
import { Card } from '../ui';
import GameCard from './GameCard';

export interface FieldCardsDTO {
  first: {
    suit: 'SPADES' | 'HEARTS' | 'DIAMONDS' | 'CLUBS';
    rank: number;
  };
  second: {
    suit: 'SPADES' | 'HEARTS' | 'DIAMONDS' | 'CLUBS';
    rank: number;
  };
}

export interface GameBoardProps {
  fieldCards: FieldCardsDTO;
  onFieldClick?: (fieldIndex: 0 | 1) => void; // 場札の位置をクリックしたとき
  playableCards?: Array<{
    suit: 'SPADES' | 'HEARTS' | 'DIAMONDS' | 'CLUBS';
    rank: number;
  }>; // プレイ可能なカードのリスト
  selectedCard?: {
    suit: 'SPADES' | 'HEARTS' | 'DIAMONDS' | 'CLUBS';
    rank: number;
  } | null; // 選択されたカード
  className?: string;
}

const GameBoard: React.FC<GameBoardProps> = ({
  fieldCards,
  onFieldClick,
  playableCards = [],
  selectedCard,
  className = ''
}) => {
  const handleFieldClick = (fieldIndex: 0 | 1) => {
    if (onFieldClick) {
      onFieldClick(fieldIndex);
    }
  };

  // 場札が選択されたカードでプレイ可能かどうかチェック
  const isFieldPlayable = (fieldIndex: 0 | 1): boolean => {
    if (!selectedCard || !onFieldClick) return false;

    const fieldCard = fieldIndex === 0 ? fieldCards.first : fieldCards.second;

    // ルール1: 同じスートのカードは出せる
    if (selectedCard.suit === fieldCard.suit) {
      return true;
    }

    // ルール2: 数字が±1以内のカードは出せる
    const rankDiff = Math.abs(selectedCard.rank - fieldCard.rank);
    if (rankDiff <= 1 || (selectedCard.rank === 1 && fieldCard.rank === 13) || (selectedCard.rank === 13 && fieldCard.rank === 1)) {
      return true;
    }

    return false;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card variant="elevated" className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-bold mb-6">場札</h3>

          <div className="flex justify-center gap-8">
            {/* 1番目の場札 */}
            <div
              className={`relative ${onFieldClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''} ${
                selectedCard && isFieldPlayable(0) ? 'ring-2 ring-green-500 ring-opacity-75' : ''
              }`}
              onClick={() => handleFieldClick(0)}
            >
              <GameCard
                suit={fieldCards.first.suit}
                rank={fieldCards.first.rank}
                playable={false}
                size="lg"
              />
              {onFieldClick && (
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
              )}
            </div>

            {/* 2番目の場札 */}
            <div
              className={`relative ${onFieldClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''} ${
                selectedCard && isFieldPlayable(1) ? 'ring-2 ring-green-500 ring-opacity-75' : ''
              }`}
              onClick={() => handleFieldClick(1)}
            >
              <GameCard
                suit={fieldCards.second.suit}
                rank={fieldCards.second.rank}
                playable={false}
                size="lg"
              />
              {onFieldClick && (
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
              )}
            </div>
          </div>

          {onFieldClick && (
            <p className="text-sm text-secondary mt-4">
              カードをプレイしたい位置をクリックしてください
            </p>
          )}

          {playableCards.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-green-600 mb-2">
                プレイ可能なカード: {playableCards.length}枚
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {playableCards.slice(0, 5).map((card, index) => (
                  <GameCard
                    key={`${card.suit}-${card.rank}-${index}`}
                    suit={card.suit}
                    rank={card.rank}
                    playable={false}
                    size="sm"
                  />
                ))}
                {playableCards.length > 5 && (
                  <div className="text-xs text-secondary self-center">
                    +{playableCards.length - 5}枚
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default GameBoard;