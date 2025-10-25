import apiClient, { type ApiResponse } from './client';

// APIレスポンスの型定義
export interface RoomPlayerInfo {
  playerId: string;
  username: string;
  avatar: string;
  isReady: boolean;
  isHost: boolean;
}

export interface RoomResponse {
  roomId: string;
  roomCode: string;
  roomName: string | null;
  hostId: string;
  maxPlayers: number;
  currentPlayers: number;
  initialHandSize: number;
  turnTimeLimit: number;
  isPublic: boolean;
  status: string;
  players: RoomPlayerInfo[];
  createdAt: string;
}

export interface RoomListItem {
  roomId: string;
  roomCode: string;
  roomName: string | null;
  hostUsername: string;
  currentPlayers: number;
  maxPlayers: number;
  initialHandSize: number;
  turnTimeLimit: number;
  status: string;
  createdAt: string;
}

export interface RoomListResponse {
  rooms: RoomListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RoomCodeResponse {
  roomId: string;
  roomCode: string;
  roomName: string | null;
  currentPlayers: number;
  maxPlayers: number;
  status: string;
}

export interface RoomCreateRequest {
  roomName?: string;
  maxPlayers?: number;
  initialHandSize?: number;
  turnTimeLimit?: number;
  isPublic?: boolean;
  hostId?: string;
}

export interface RoomJoinRequest {
  playerId: string;
}

export interface RoomLeaveRequest {
  playerId: string;
}

export interface RoomReadyRequest {
  playerId: string;
  isReady: boolean;
}

export interface RoomStartRequest {
  hostId: string;
}

export interface RoomJoinResponse {
  roomId: string;
  playerId: string;
  joinedAt: string;
}

export interface RoomLeaveResponse {
  roomId: string;
  playerId: string;
  leftAt: string;
}

export interface RoomReadyResponse {
  playerId: string;
  isReady: boolean;
}

export interface RoomStartResponse {
  roomId: string;
  gameId: string;
  status: string;
  startedAt: string;
}

// チャット関連の型定義
export interface ChatMessageRequest {
  playerId: string;
  message: string;
  type?: string; // "text" | "emoji" | "preset"
}

export interface ChatMessageResponse {
  messageId: string;
  roomId: string;
  playerId: string;
  username: string;
  avatar: string;
  message: string;
  type: string;
  createdAt: string;
}

export interface ChatMessagesResponse {
  messages: ChatMessageResponse[];
  hasMore: boolean;
}

// ルーム作成API
export const createRoom = async (request: RoomCreateRequest): Promise<RoomResponse> => {
  const response = await apiClient.post<ApiResponse<RoomResponse>>('/rooms', request);
  return response.data.data!;
};

// ルーム一覧取得API
export const getRooms = async (
  status?: string,
  maxPlayers?: number,
  page?: number,
  limit?: number
): Promise<RoomListResponse> => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (maxPlayers) params.append('maxPlayers', maxPlayers.toString());
  if (page) params.append('page', page.toString());
  if (limit) params.append('limit', limit.toString());

  const queryString = params.toString();
  const url = queryString ? `/rooms?${queryString}` : '/rooms';

  const response = await apiClient.get<ApiResponse<RoomListResponse>>(url);
  return response.data.data!;
};

// ルーム詳細取得API
export const getRoom = async (roomId: string): Promise<RoomResponse> => {
  const response = await apiClient.get<ApiResponse<RoomResponse>>(`/rooms/${roomId}`);
  return response.data.data!;
};

// ルームコードでルーム取得API
export const getRoomByCode = async (roomCode: string): Promise<RoomCodeResponse> => {
  const response = await apiClient.get<ApiResponse<RoomCodeResponse>>(`/rooms/code/${roomCode}`);
  return response.data.data!;
};

// ルーム参加API
export const joinRoom = async (roomId: string, request: RoomJoinRequest): Promise<RoomJoinResponse> => {
  const response = await apiClient.post<ApiResponse<RoomJoinResponse>>(`/rooms/${roomId}/join`, request);
  return response.data.data!;
};

// ルーム退出API
export const leaveRoom = async (roomId: string, request: RoomLeaveRequest): Promise<RoomLeaveResponse> => {
  const response = await apiClient.post<ApiResponse<RoomLeaveResponse>>(`/rooms/${roomId}/leave`, request);
  return response.data.data!;
};

// 準備完了設定API
export const setReady = async (roomId: string, request: RoomReadyRequest): Promise<RoomReadyResponse> => {
  const response = await apiClient.post<ApiResponse<RoomReadyResponse>>(`/rooms/${roomId}/ready`, request);
  return response.data.data!;
};

// ゲーム開始API
export const startGame = async (roomId: string, request: RoomStartRequest): Promise<RoomStartResponse> => {
  const response = await apiClient.post<ApiResponse<RoomStartResponse>>(`/rooms/${roomId}/start`, request);
  return response.data.data!;
};

// チャットメッセージ送信API
export const sendChatMessage = async (roomId: string, request: ChatMessageRequest): Promise<ChatMessageResponse> => {
  const response = await apiClient.post<ApiResponse<ChatMessageResponse>>(`/rooms/${roomId}/chat`, request);
  return response.data.data!;
};

// チャットメッセージ履歴取得API
export const getChatMessages = async (
  roomId: string,
  limit?: number,
  before?: string
): Promise<ChatMessagesResponse> => {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (before) params.append('before', before);

  const queryString = params.toString();
  const url = queryString ? `/rooms/${roomId}/chat?${queryString}` : `/rooms/${roomId}/chat`;

  const response = await apiClient.get<ApiResponse<ChatMessagesResponse>>(url);
  return response.data.data!;
};