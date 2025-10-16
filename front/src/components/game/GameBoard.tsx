import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '../ui';
import GameCard from './GameCard';

export interface CardData {
  number: number;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  id: string;
}

export interface GameBoardProps {
  centerCard: CardData;
  playerHand: CardData[];
  onCardPlay: (card: CardData) => void;
  currentPlayer: number;
  isPlayerTurn: boolean;
  timeLeft: number;
}

const GameBoard: React.FC<GameBoardProps> = ({
  centerCard,
  playerHand,
  onCardPlay,
  currentPlayer: _currentPlayer,
  isPlayerTurn,
  timeLeft
}) => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [playingCard, setPlayingCard] = useState<string | null>(null);
  const [lastPlayedCard, setLastPlayedCard] = useState<CardData | null>(null);

  // カードがプレイ可能かチェック
  const isCardPlayable = useCallback((card: CardData): boolean => {
    if (!isPlayerTurn) return false;
    
    const centerNumber = centerCard.number;
    const cardNumber = card.number;
    
    // ±1以内または同じ数字
    return Math.abs(centerNumber - cardNumber) <= 1 || centerNumber === cardNumber;
  }, [centerCard.number, isPlayerTurn]);

  // カードクリック処理
  const handleCardClick = useCallback((card: CardData) => {
    if (!isCardPlayable(card)) return;
    
    if (selectedCard === card.id) {
      // 既に選択されているカードをクリック → プレイ
      handleCardPlay(card);
    } else {
      // 新しいカードを選択
      setSelectedCard(card.id);
    }
  }, [selectedCard, isCardPlayable]);

  // カードダブルクリック処理（即座にプレイ）
  const handleCardDoubleClick = useCallback((card: CardData) => {
    if (!isCardPlayable(card)) return;
    handleCardPlay(card);
  }, [isCardPlayable]);

  // カードプレイ処理
  const handleCardPlay = useCallback((card: CardData) => {
    setPlayingCard(card.id);
    setLastPlayedCard(card);
    setSelectedCard(null);
    
    // アニメーション後にカードを実際にプレイ
    setTimeout(() => {
      onCardPlay(card);
      setPlayingCard(null);
    }, 500);
  }, [onCardPlay]);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isPlayerTurn) return;
      
      const num = parseInt(event.key);
      if (num >= 1 && num <= 9) {
        const card = playerHand.find(c => c.number === num && isCardPlayable(c));
        if (card) {
          handleCardPlay(card);
        }
      }
      
      if (event.key === 'Enter' && selectedCard) {
        const card = playerHand.find(c => c.id === selectedCard);
        if (card && isCardPlayable(card)) {
          handleCardPlay(card);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlayerTurn, playerHand, selectedCard, handleCardPlay, isCardPlayable]);

  return (
    <div className="space-y-6">
      {/* 場のカード */}
      <Card variant="elevated" className="relative">
        <div className="p-6 text-center">
          <h3 className="font-bold mb-4">場のカード</h3>
          
          {/* センターカード */}
          <div className="relative flex justify-center">
            <GameCard
              number={centerCard.number}
              suit={centerCard.suit}
              size="lg"
              playable={false}
              className="relative z-10"
            />
            
            {/* プレイされたカードのアニメーション */}
            {lastPlayedCard && (
              <div 
                className="absolute z-20 animate-bounce"
                style={{
                  animation: 'cardPlay 0.5s ease-out forwards'
                }}
              >
                <GameCard
                  number={lastPlayedCard.number}
                  suit={lastPlayedCard.suit}
                  size="lg"
                  playable={false}
                />
              </div>
            )}
          </div>
          
          <div className="mt-4 space-y-2">
            <p className="text-sm text-secondary">
              ±1以内の数字または同じ数字を出せます
            </p>
            {isPlayerTurn && (
              <p className="text-sm font-medium text-green-600">
                あなたのターンです！
              </p>
            )}
            {timeLeft <= 10 && timeLeft > 0 && (
              <p className="text-sm font-bold text-red-500 animate-pulse">
                残り {timeLeft} 秒
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* プレイヤーの手札 */}
      <Card variant="elevated">
        <div className="p-6">
          <h3 className="font-bold mb-4 text-center">あなたの手札</h3>
          
          <div className="flex gap-2 justify-center flex-wrap">
            {playerHand.map((card) => {
              const isPlayable = isCardPlayable(card);
              const isSelected = selectedCard === card.id;
              const isPlaying = playingCard === card.id;
              
              return (
                <div
                  key={card.id}
                  className={`transition-all duration-300 ${
                    isPlaying ? 'animate-pulse opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <GameCard
                    number={card.number}
                    suit={card.suit}
                    playable={isPlayable}
                    selected={isSelected}
                    onClick={() => handleCardClick(card)}
                    onDoubleClick={() => handleCardDoubleClick(card)}
                    className={`${!isPlayable ? 'grayscale' : ''}`}
                  />
                </div>
              );
            })}
          </div>
          
          <div className="text-center mt-4 space-y-1">
            <p className="text-sm text-secondary">
              カードをクリックして選択、もう一度クリックまたはダブルクリックでプレイ
            </p>
            {isPlayerTurn && (
              <p className="text-xs text-secondary">
                ショートカット: 数字キー(1-9)で直接プレイ、Enterで選択中のカードをプレイ
              </p>
            )}
          </div>
        </div>
      </Card>


    </div>
  );
};

export default GameBoard;