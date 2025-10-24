import apiClient from './client';
import type { ApiResponse } from './client';

/**
 * カードDTO
 */
export interface CardDTO {
  suit: 'SPADES' | 'HEARTS' | 'DIAMONDS' | 'CLUBS';
  rank: number; // 1-13 (1=A, 11=J, 12=Q, 13=K)
}

/**
 * プレイヤー状態DTO
 */
export interface PlayerStateDTO {
  playerId: string;
  handSize: number;
  hand: CardDTO[] | null; // 自分の手札のみ含まれる
  rank: number | null; // ゲーム終了時の順位
}

/**
 * 場札DTO
 */
export interface FieldCardsDTO {
  first: CardDTO;
  second: CardDTO;
}

/**
 * ゲーム状態レスポンス
 */
export interface GameStateResponse {
  gameId: string;
  roomId: string;
  players: PlayerStateDTO[];
  fieldCards: FieldCardsDTO;
  currentPlayerId: string;
  currentPlayerIndex: number;
  deckRemaining: number;
  status: 'PLAYING' | 'FINISHED' | 'ABORTED';
  playableCards: CardDTO[] | null; // 自分がcurrentPlayerの場合のみ
  startedAt: number; // timestamp
  lastUpdatedAt: number; // timestamp
}

/**
 * ゲーム作成リクエスト
 */
export interface CreateGameRequest {
  roomId: string;
  playerIds: string[];
}

/**
 * ゲーム作成レスポンス
 */
export interface CreateGameResponse {
  gameId: string;
  roomId: string;
  status: string;
  message: string;
}

/**
 * カードプレイリクエスト
 */
export interface PlayCardRequest {
  playerId: string;
  card: CardDTO;
  targetField: number; // 0 or 1
}

/**
 * カードドローリクエスト
 */
export interface DrawCardRequest {
  playerId: string;
}

/**
 * ターンスキップリクエスト
 */
export interface SkipTurnRequest {
  playerId: string;
}

/**
 * ゲームアクションレスポンス
 */
export interface GameActionResponse {
  success: boolean;
  message: string;
  gameState: GameStateResponse | null;
}

/**
 * プレイヤー結果DTO
 */
export interface PlayerResultDTO {
  playerId: string;
  username: string;
  rank: number; // 順位 (1位、2位...)
  remainingCards: number; // 残り手札枚数
  cardsPlayed: number; // プレイしたカード枚数
}

/**
 * ゲーム結果レスポンス
 */
export interface GameResultResponse {
  gameId: string;
  roomId: string;
  status: 'FINISHED' | 'ABORTED';
  ranking: PlayerResultDTO[]; // プレイヤーランキング（順位順）
  playTimeSeconds: number; // ゲームプレイ時間（秒）
  totalTurns: number; // 総ターン数
  startedAt: number; // 開始時刻（Unix timestamp ミリ秒）
  finishedAt: number; // 終了時刻（Unix timestamp ミリ秒）
}

/**
 * ゲームを作成
 * POST /api/v1/games
 */
export const createGame = async (request: CreateGameRequest): Promise<CreateGameResponse> => {
  const response = await apiClient.post<ApiResponse<CreateGameResponse>>('/games', request);
  return response.data.data!;
};

/**
 * ゲーム状態を取得
 * GET /api/v1/games/:gameId/state
 */
export const getGameState = async (gameId: string, playerId?: string): Promise<GameStateResponse> => {
  const params = new URLSearchParams();
  if (playerId) {
    params.append('playerId', playerId);
  }
  const queryString = params.toString();
  const url = queryString ? `/games/${gameId}/state?${queryString}` : `/games/${gameId}/state`;
  
  const response = await apiClient.get<ApiResponse<GameStateResponse>>(url);
  return response.data.data!;
};

/**
 * カードをプレイ
 * POST /api/v1/games/:gameId/actions/play
 */
export const playCard = async (
  gameId: string,
  request: PlayCardRequest
): Promise<GameActionResponse> => {
  const response = await apiClient.post<ApiResponse<GameActionResponse>>(
    `/games/${gameId}/actions/play`,
    request
  );
  return response.data.data!;
};

/**
 * カードをドロー
 * POST /api/v1/games/:gameId/actions/draw
 */
export const drawCard = async (
  gameId: string,
  request: DrawCardRequest
): Promise<GameActionResponse> => {
  const response = await apiClient.post<ApiResponse<GameActionResponse>>(
    `/games/${gameId}/actions/draw`,
    request
  );
  return response.data.data!;
};

/**
 * ターンをスキップ
 * POST /api/v1/games/:gameId/actions/skip
 */
export const skipTurn = async (
  gameId: string,
  request: SkipTurnRequest
): Promise<GameActionResponse> => {
  const response = await apiClient.post<ApiResponse<GameActionResponse>>(
    `/games/${gameId}/actions/skip`,
    request
  );
  return response.data.data!;
};

/**
 * ゲーム結果を取得
 * GET /api/v1/games/:gameId/result
 */
export const getGameResult = async (gameId: string): Promise<GameResultResponse> => {
  const response = await apiClient.get<ApiResponse<GameResultResponse>>(
    `/games/${gameId}/result`
  );
  return response.data.data!;
};
