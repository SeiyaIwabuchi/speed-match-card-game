import apiClient, { type ApiResponse } from './client';

// チャットメッセージの型定義
export interface ChatMessage {
  id: string;
  roomId: string;
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  message: string;
  createdAt: string;
}

// メッセージ送信リクエストの型
export interface SendMessageRequest {
  playerId: string;
  playerName: string;
  playerAvatar?: string;
  message: string;
}

// メッセージ取得レスポンスの型
export interface GetMessagesResponse {
  messages: ChatMessage[];
  total: number;
}

/**
 * チャットメッセージを送信
 * @param roomId - ルームID
 * @param request - メッセージ送信リクエスト
 * @returns 送信されたメッセージ
 */
export const sendMessage = async (
  roomId: string,
  request: SendMessageRequest
): Promise<ChatMessage> => {
  const response = await apiClient.post<ApiResponse<ChatMessage>>(
    `/rooms/${roomId}/messages`,
    request
  );
  return response.data.data!;
};

/**
 * チャットメッセージ一覧を取得
 * @param roomId - ルームID
 * @param limit - 取得件数（オプション）
 * @param offset - オフセット（オプション）
 * @returns メッセージ一覧
 */
export const getMessages = async (
  roomId: string,
  limit?: number,
  offset?: number
): Promise<GetMessagesResponse> => {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (offset) params.append('offset', offset.toString());

  const response = await apiClient.get<ApiResponse<GetMessagesResponse>>(
    `/rooms/${roomId}/messages?${params.toString()}`
  );
  return response.data.data!;
};

/**
 * 最新のメッセージを取得（ポーリング用）
 * @param roomId - ルームID
 * @param since - この日時以降のメッセージを取得
 * @returns 新しいメッセージ一覧
 */
export const getNewMessages = async (
  roomId: string,
  since?: string
): Promise<ChatMessage[]> => {
  const params = new URLSearchParams();
  if (since) params.append('since', since);

  const response = await apiClient.get<ApiResponse<GetMessagesResponse>>(
    `/rooms/${roomId}/messages?${params.toString()}`
  );
  return response.data.data?.messages || [];
};
