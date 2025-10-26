import React from 'react';
import { Card } from '../ui';
import GameCard from './GameCard';
import './GameBoard.css';

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
    <div className={`gameBoard ${className}`}>
      <Card variant="elevated" className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-bold mb-6">場札</h3>

          <div className="fieldsContainer">
            {/* 1番目の場札 */}
            <div
              className={`fieldCard ${
                selectedCard && onFieldClick
                  ? isFieldPlayable(0)
                    ? 'fieldCard--playable'
                    : 'fieldCard--notPlayable'
                  : ''
              }`}
              onClick={() => selectedCard && isFieldPlayable(0) && handleFieldClick(0)}
            >
              <GameCard
                suit={fieldCards.first.suit}
                rank={fieldCards.first.rank}
                playable={false}
                size="lg"
              />
              {selectedCard && onFieldClick && (
                <div className={`fieldBadge ${
                  isFieldPlayable(0)
                    ? 'fieldBadge--playable'
                    : 'fieldBadge--notPlayable'
                }`}>
                  1
                </div>
              )}
              {!selectedCard && onFieldClick && (
                <div className="fieldBadge fieldBadge--default">
                  1
                </div>
              )}
            </div>

            {/* 2番目の場札 */}
            <div
              className={`fieldCard ${
                selectedCard && onFieldClick
                  ? isFieldPlayable(1)
                    ? 'fieldCard--playable'
                    : 'fieldCard--notPlayable'
                  : ''
              }`}
              onClick={() => selectedCard && isFieldPlayable(1) && handleFieldClick(1)}
            >
              <GameCard
                suit={fieldCards.second.suit}
                rank={fieldCards.second.rank}
                playable={false}
                size="lg"
              />
              {selectedCard && onFieldClick && (
                <div className={`fieldBadge ${
                  isFieldPlayable(1)
                    ? 'fieldBadge--playable'
                    : 'fieldBadge--notPlayable'
                }`}>
                  2
                </div>
              )}
              {!selectedCard && onFieldClick && (
                <div className="fieldBadge fieldBadge--default">
                  2
                </div>
              )}
            </div>
          </div>

          {selectedCard && onFieldClick && (
            <div className="guidanceBox">
              <p className="guidanceText">
                🟢 緑色に光っている場札をクリックできます
              </p>
            </div>
          )}

          {!selectedCard && onFieldClick && (
            <p className="selectCardMessage">
              まず手札からカードを選択してください
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