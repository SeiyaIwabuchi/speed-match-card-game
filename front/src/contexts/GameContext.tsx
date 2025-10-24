import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { 
  GameStateResponse,
  PlayCardRequest,
  DrawCardRequest,
  SkipTurnRequest,
  GameResultResponse
} from '../api/game';
import * as gameApi from '../api/game';

// UI用のカードデータ型（既存のコードとの互換性維持）
export interface CardData {
  suit: 'SPADES' | 'HEARTS' | 'DIAMONDS' | 'CLUBS';
  rank: number; // 1-13
}

// UI用のプレイヤーデータ型
export interface Player {
  id: string;
  handSize: number;
  hand: CardData[] | null; // 自分の手札のみ
  rank: number | null;
}

// ゲーム状態型（APIレスポンスに基づく）
export interface GameState {
  gameId: string | null;
  roomId: string;
  players: Player[];
  fieldCards: {
    first: CardData;
    second: CardData;
  } | null;
  currentPlayerId: string;
  currentPlayerIndex: number;
  deckRemaining: number;
  status: 'PLAYING' | 'FINISHED' | 'ABORTED' | 'WAITING';
  playableCards: CardData[] | null;
  startedAt: number | null;
  lastUpdatedAt: number | null;
}

interface GameContextType {
  gameState: GameState;
  gameResult: GameResultResponse | null;
  loading: boolean;
  error: string | null;
  isPlayerTurn: () => boolean;
  fetchGameState: () => Promise<void>;
  fetchGameResult: () => Promise<void>;
  handlePlayCard: (card: CardData, targetField: number) => Promise<void>;
  handleDrawCard: () => Promise<void>;
  handleSkipTurn: () => Promise<void>;
  clearError: () => void;
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
  gameId?: string; // ゲームID（既存ゲームに参加する場合）
  roomId?: string; // ルームID（新規ゲーム作成時）
  playerId: string;
}

export const GameProvider: React.FC<GameProviderProps> = ({ 
  children, 
  gameId: initialGameId,
  roomId: initialRoomId,
  playerId 
}) => {
  const [gameState, setGameState] = useState<GameState>({
    gameId: initialGameId || null,
    roomId: initialRoomId || '',
    players: [],
    fieldCards: null,
    currentPlayerId: '',
    currentPlayerIndex: 0,
    deckRemaining: 0,
    status: 'WAITING',
    playableCards: null,
    startedAt: null,
    lastUpdatedAt: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameResult, setGameResult] = useState<GameResultResponse | null>(null);

  // APIレスポンスをGameStateに変換
  const convertToGameState = (response: GameStateResponse): GameState => {
    return {
      gameId: response.gameId,
      roomId: response.roomId,
      players: response.players.map(p => ({
        id: p.playerId,
        handSize: p.handSize,
        hand: p.hand,
        rank: p.rank
      })),
      fieldCards: response.fieldCards,
      currentPlayerId: response.currentPlayerId,
      currentPlayerIndex: response.currentPlayerIndex,
      deckRemaining: response.deckRemaining,
      status: response.status,
      playableCards: response.playableCards,
      startedAt: response.startedAt,
      lastUpdatedAt: response.lastUpdatedAt
    };
  };

  // ゲーム状態を取得
  const fetchGameState = async (): Promise<void> => {
    if (!gameState.gameId) {
      setError('ゲームIDが設定されていません');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await gameApi.getGameState(gameState.gameId, playerId);
      setGameState(convertToGameState(response));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ゲーム状態の取得に失敗しました';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ゲーム結果を取得
  const fetchGameResult = async (): Promise<void> => {
    if (!gameState.gameId) {
      setError('ゲームIDが設定されていません');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await gameApi.getGameResult(gameState.gameId);
      setGameResult(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ゲーム結果の取得に失敗しました';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 自分のターンかチェック
  const isPlayerTurn = (): boolean => {
    return gameState.currentPlayerId === playerId && gameState.status === 'PLAYING';
  };

  // カードをプレイ
  const handlePlayCard = async (card: CardData, targetField: number): Promise<void> => {
    if (!gameState.gameId) {
      setError('ゲームIDが設定されていません');
      return;
    }

    if (!isPlayerTurn()) {
      setError('あなたのターンではありません');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: PlayCardRequest = {
        playerId,
        card,
        targetField
      };

      const response = await gameApi.playCard(gameState.gameId, request);
      
      if (response.success && response.gameState) {
        setGameState(convertToGameState(response.gameState));
      } else {
        setError(response.message || 'カードのプレイに失敗しました');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'カードのプレイに失敗しました';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // カードをドロー
  const handleDrawCard = async (): Promise<void> => {
    if (!gameState.gameId) {
      setError('ゲームIDが設定されていません');
      return;
    }

    if (!isPlayerTurn()) {
      setError('あなたのターンではありません');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: DrawCardRequest = {
        playerId
      };

      const response = await gameApi.drawCard(gameState.gameId, request);
      
      if (response.success && response.gameState) {
        setGameState(convertToGameState(response.gameState));
      } else {
        setError(response.message || 'カードのドローに失敗しました');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'カードのドローに失敗しました';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ターンをスキップ
  const handleSkipTurn = async (): Promise<void> => {
    if (!gameState.gameId) {
      setError('ゲームIDが設定されていません');
      return;
    }

    if (!isPlayerTurn()) {
      setError('あなたのターンではありません');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: SkipTurnRequest = {
        playerId
      };

      const response = await gameApi.skipTurn(gameState.gameId, request);
      
      if (response.success && response.gameState) {
        setGameState(convertToGameState(response.gameState));
      } else {
        setError(response.message || 'ターンのスキップに失敗しました');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ターンのスキップに失敗しました';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const contextValue: GameContextType = {
    gameState,
    gameResult,
    loading,
    error,
    isPlayerTurn,
    fetchGameState,
    fetchGameResult,
    handlePlayCard,
    handleDrawCard,
    handleSkipTurn,
    clearError
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};