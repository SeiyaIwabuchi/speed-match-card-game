import React, { useState } from 'react';
import { Card } from '../ui';
import GameCard from './GameCard';
import './PlayerHand.css';

export interface CardDTO {
  suit: 'SPADES' | 'HEARTS' | 'DIAMONDS' | 'CLUBS';
  rank: number;
}

export interface PlayerHandProps {
  hand: CardDTO[]; // 自分の手札
  playableCards?: CardDTO[]; // プレイ可能なカードのリスト
  fieldCards: { first: CardDTO; second: CardDTO }; // 場札
  onCardSelect?: (card: CardDTO) => void; // カード選択時のコールバック
  onCardPlay?: (card: CardDTO, targetField: 0 | 1) => void; // カードプレイ時のコールバック（直接プレイ）
  isPlayerTurn: boolean;
  className?: string;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  playableCards = [],
  fieldCards,
  onCardSelect,
  onCardPlay,
  isPlayerTurn,
  className = ''
}) => {
  const [selectedCard, setSelectedCard] = useState<CardDTO | null>(null);

  // カードが特定の場札に出せるかどうかチェック
  const isCardPlayableForField = (card: CardDTO, fieldIndex: 0 | 1): boolean => {
    if (!isPlayerTurn) return false;

    const fieldCard = fieldIndex === 0 ? fieldCards.first : fieldCards.second;

    // ルール1: 同じスートのカードは出せる
    if (card.suit === fieldCard.suit) {
      return true;
    }

    // ルール2: 数字が±1以内のカードは出せる
    const rankDiff = Math.abs(card.rank - fieldCard.rank);
    if (rankDiff <= 1 || (card.rank === 1 && fieldCard.rank === 13) || (card.rank === 13 && fieldCard.rank === 1)) {
      return true;
    }

    return false;
  };

  // カードがプレイ可能かどうかチェック（ルール + APIのplayableCards）
  const isCardPlayable = (card: CardDTO): boolean => {
    if (!isPlayerTurn) return false;

    // APIのplayableCardsに含まれているかチェック
    const isInPlayableCards = playableCards.some(pc => pc.suit === card.suit && pc.rank === card.rank);
    if (!isInPlayableCards) return false;

    // ルールに基づいてどちらかの場札に出せるかチェック
    return isCardPlayableForField(card, 0) || isCardPlayableForField(card, 1);
  };

  // カードクリック処理
  const handleCardClick = (card: CardDTO) => {
    if (!isCardPlayable(card)) return;

    if (onCardSelect) {
      // カード選択モードの場合
      onCardSelect(card);
    } else if (onCardPlay) {
      // 直接プレイ可能な場札を探す
      const playableFields: (0 | 1)[] = [];
      if (isCardPlayableForField(card, 0)) playableFields.push(0);
      if (isCardPlayableForField(card, 1)) playableFields.push(1);

      if (playableFields.length === 1) {
        // 1つの場札のみに出せる場合、直接プレイ
        onCardPlay(card, playableFields[0]);
      } else if (playableFields.length === 2) {
        // 両方の場札に出せる場合、選択状態にする
        setSelectedCard(card);
      }
    }
  };

  // 場札クリック処理（カードが選択されている場合）
  const handleFieldSelect = (fieldIndex: 0 | 1) => {
    if (!selectedCard || !onCardPlay) return;

    onCardPlay(selectedCard, fieldIndex);
    setSelectedCard(null);
  };

  return (
    <div className={`playerHand ${className}`}>
      <Card variant="elevated" className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-bold mb-4">あなたの手札 ({hand.length}枚)</h3>

          {!isPlayerTurn && (
            <p className="turnMessage">
              他のプレイヤーのターンです
            </p>
          )}

          {isPlayerTurn && !selectedCard && hand.length > 0 && (
            <div className="guidanceBox">
              <p className="guidanceText">
                ⬆️ プレイ可能なカードをクリックしてください
              </p>
            </div>
          )}

          {hand.length === 0 ? (
            <p className="text-secondary">手札がありません</p>
          ) : (
            <div className="cardContainer">
              {hand.map((card, index) => {
                const playable = isCardPlayable(card);
                const isSelected = selectedCard?.suit === card.suit && selectedCard?.rank === card.rank;

                return (
                  <div
                    key={`${card.suit}-${card.rank}-${index}`}
                    className={`cardWrapper ${
                      playable ? 'cardWrapper--playable' : 'cardWrapper--notPlayable'
                    } ${
                      isSelected ? 'cardWrapper--selected' : ''
                    }`}
                  >
                    <GameCard
                      suit={card.suit}
                      rank={card.rank}
                      playable={playable}
                      selected={isSelected}
                      onClick={() => handleCardClick(card)}
                      size="md"
                      className={!playable ? 'opacity-60' : ''}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {selectedCard && (
            <div className="selectionBox">
              <p className="selectionTitle">
                選択中: {selectedCard.suit} {selectedCard.rank === 1 ? 'A' : selectedCard.rank === 11 ? 'J' : selectedCard.rank === 12 ? 'Q' : selectedCard.rank === 13 ? 'K' : selectedCard.rank}
              </p>
              <p className="selectionGuidance">
                ⬇️ 下の場札をクリックしてカードをプレイしてください
              </p>
              <div className="buttonGroup">
                <button
                  onClick={() => handleFieldSelect(0)}
                  className="fieldButton"
                >
                  場札1 ({fieldCards.first.suit} {fieldCards.first.rank === 1 ? 'A' : fieldCards.first.rank === 11 ? 'J' : fieldCards.first.rank === 12 ? 'Q' : fieldCards.first.rank === 13 ? 'K' : fieldCards.first.rank})
                </button>
                <button
                  onClick={() => handleFieldSelect(1)}
                  className="fieldButton"
                >
                  場札2 ({fieldCards.second.suit} {fieldCards.second.rank === 1 ? 'A' : fieldCards.second.rank === 11 ? 'J' : fieldCards.second.rank === 12 ? 'Q' : fieldCards.second.rank === 13 ? 'K' : fieldCards.second.rank})
                </button>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="cancelButton"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {isPlayerTurn && hand.length > 0 && (
            <p className="yourTurnMessage">
              あなたのターンです！ カードをクリックしてプレイしてください
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PlayerHand;