import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface CardData {
  number: number;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  id: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  handSize: number;
  isReady: boolean;
}

export interface GameStats {
  totalTurns: number;
  playTime: number; // 秒単位
  playerActions: { [playerId: string]: number };
  gameStartTime: number | null;
}

export interface GameState {
  roomId: string;
  players: Player[];
  currentPlayerIndex: number;
  centerCard: CardData;
  playerHand: CardData[];
  gamePhase: 'waiting' | 'playing' | 'finished';
  timeLeft: number;
  winner: Player | null;
  gameHistory: CardData[];
  stats: GameStats;
}

interface GameContextType {
  gameState: GameState;
  isPlayerTurn: () => boolean;
  playCard: (card: CardData) => void;
  leaveGame: () => void;
  startGame: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
  roomId: string;
  playerId: string;
}

export const GameProvider: React.FC<GameProviderProps> = ({ 
  children, 
  roomId, 
  playerId 
}) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    // 初期ゲーム状態（モックデータ）
    return {
      roomId,
      players: [
        { id: playerId, name: 'あなた', avatar: 'Y', handSize: 5, isReady: true },
        { id: 'player2', name: 'プレイヤー2', avatar: 'P', handSize: 5, isReady: true },
        { id: 'player3', name: 'プレイヤー3', avatar: 'Q', handSize: 5, isReady: true },
      ],
      currentPlayerIndex: 0,
      centerCard: { id: 'center-1', number: 7, suit: 'hearts' },
      playerHand: [
        { id: 'hand-1', number: 6, suit: 'spades' },
        { id: 'hand-2', number: 8, suit: 'hearts' },
        { id: 'hand-3', number: 7, suit: 'clubs' },
        { id: 'hand-4', number: 3, suit: 'diamonds' },
        { id: 'hand-5', number: 9, suit: 'hearts' },
      ],
      gamePhase: 'playing',
      timeLeft: 30,
      winner: null,
      gameHistory: [],
      stats: {
        totalTurns: 0,
        playTime: 0,
        playerActions: {
          [playerId]: 0,
          'player2': 0,
          'player3': 0
        },
        gameStartTime: Date.now()
      }
    };
  });

  // タイマー管理とプレイ時間計測
  useEffect(() => {
    if (gameState.gamePhase !== 'playing') return;
    
    const timer = setInterval(() => {
      setGameState(prev => {
        const newPlayTime = prev.stats.gameStartTime 
          ? Math.floor((Date.now() - prev.stats.gameStartTime) / 1000)
          : prev.stats.playTime;

        if (prev.timeLeft <= 1) {
          // 時間切れ - 次のプレイヤーのターン
          return {
            ...prev,
            currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
            timeLeft: 30,
            stats: {
              ...prev.stats,
              playTime: newPlayTime,
              totalTurns: prev.stats.totalTurns + 1
            }
          };
        }
        return {
          ...prev,
          timeLeft: prev.timeLeft - 1,
          stats: {
            ...prev.stats,
            playTime: newPlayTime
          }
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.gamePhase, gameState.currentPlayerIndex]);

  const isPlayerTurn = (): boolean => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    return currentPlayer?.id === playerId && gameState.gamePhase === 'playing';
  };

  const playCard = (card: CardData): void => {
    if (!isPlayerTurn()) return;
    
    setGameState(prev => {
      // 手札からカードを削除
      const newHand = prev.playerHand.filter(c => c.id !== card.id);
      
      // プレイヤーの手札数を更新
      const updatedPlayers = prev.players.map(player => 
        player.id === playerId 
          ? { ...player, handSize: newHand.length }
          : player
      );

      // 勝利条件チェック
      const winner = newHand.length === 0 
        ? prev.players.find(p => p.id === playerId) || null
        : null;

      // 統計情報を更新
      const newPlayerActions = {
        ...prev.stats.playerActions,
        [playerId]: (prev.stats.playerActions[playerId] || 0) + 1
      };

      const playTime = prev.stats.gameStartTime 
        ? Math.floor((Date.now() - prev.stats.gameStartTime) / 1000)
        : prev.stats.playTime;

      return {
        ...prev,
        centerCard: card,
        playerHand: newHand,
        players: updatedPlayers,
        currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
        timeLeft: 30,
        gameHistory: [...prev.gameHistory, card],
        winner,
        gamePhase: winner ? 'finished' : 'playing',
        stats: {
          ...prev.stats,
          totalTurns: prev.stats.totalTurns + 1,
          playerActions: newPlayerActions,
          playTime
        }
      };
    });
  };

  const leaveGame = (): void => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'finished'
    }));
  };

  const startGame = (): void => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'playing',
      timeLeft: 30,
      stats: {
        totalTurns: 0,
        playTime: 0,
        playerActions: Object.keys(prev.stats.playerActions).reduce((acc, key) => ({
          ...acc,
          [key]: 0
        }), {}),
        gameStartTime: Date.now()
      }
    }));
  };

  const resetGame = (): void => {
    setGameState(prev => ({
      ...prev,
      gamePhase: 'waiting',
      currentPlayerIndex: 0,
      timeLeft: 30,
      winner: null,
      gameHistory: [],
      centerCard: { id: 'center-reset', number: 7, suit: 'hearts' },
      playerHand: [
        { id: 'hand-new-1', number: 6, suit: 'spades' },
        { id: 'hand-new-2', number: 8, suit: 'hearts' },
        { id: 'hand-new-3', number: 7, suit: 'clubs' },
        { id: 'hand-new-4', number: 3, suit: 'diamonds' },
        { id: 'hand-new-5', number: 9, suit: 'hearts' },
      ],
      players: prev.players.map(p => ({ ...p, handSize: 5 })),
      stats: {
        totalTurns: 0,
        playTime: 0,
        playerActions: Object.keys(prev.stats.playerActions).reduce((acc, key) => ({
          ...acc,
          [key]: 0
        }), {}),
        gameStartTime: null
      }
    }));
  };

  const contextValue: GameContextType = {
    gameState,
    isPlayerTurn,
    playCard,
    leaveGame,
    startGame,
    resetGame
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};