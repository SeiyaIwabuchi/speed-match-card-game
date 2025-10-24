import apiClient, { type ApiResponse } from './client';

// APIレスポンスの型定義
export interface PlayerResponse {
  playerId: string;
  username: string;
  avatar: string;
  token: string;
  createdAt: string;
}

export interface PlayerStatsResponse {
  playerId: string;
  username: string;
  avatar: string;
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  fastestWin: number | null;
  totalCardsPlayed: number;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerUpdateRequest {
  username?: string;
  avatar?: string;
}

// プレイヤー登録API
export const registerPlayer = async (username: string, avatar: string): Promise<PlayerResponse> => {
  const response = await apiClient.post<ApiResponse<PlayerResponse>>('/players', {
    username,
    avatar,
  });
  return response.data.data!;
};

// プレイヤー情報取得API
export const getPlayer = async (playerId: string): Promise<PlayerResponse> => {
  const response = await apiClient.get<ApiResponse<PlayerResponse>>(`/players/${playerId}`);
  return response.data.data!;
};

// プレイヤー情報更新API
export const updatePlayer = async (playerId: string, updates: PlayerUpdateRequest): Promise<PlayerResponse> => {
  const response = await apiClient.put<ApiResponse<PlayerResponse>>(`/players/${playerId}`, updates);
  return response.data.data!;
};

// プレイヤー統計取得API
export const getPlayerStats = async (playerId: string): Promise<PlayerStatsResponse> => {
  const response = await apiClient.get<ApiResponse<PlayerStatsResponse>>(`/players/${playerId}/stats`);
  return response.data.data!;
};