import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

// APIレスポンスの共通型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// APIエラーの型
export class ApiError extends Error {
  public code: string;
  public details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }
}

// Axiosインスタンスの作成
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター
apiClient.interceptors.request.use(
  (config) => {
    // 必要に応じて認証トークンを追加
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 成功レスポンスの場合
    if (response.data.success) {
      return response;
    }
    // APIがsuccess: falseを返した場合
    throw new ApiError(
      response.data.error?.code || 'UNKNOWN_ERROR',
      response.data.error?.message || 'Unknown error occurred',
      response.data.error?.details
    );
  },
  (error) => {
    // HTTPエラーの場合
    if (error.response) {
      const { status, data } = error.response;
      if (data && data.error) {
        throw new ApiError(data.error.code, data.error.message, data.error.details);
      }
      // 標準HTTPエラー
      throw new ApiError(`HTTP_${status}`, `HTTP ${status} error`, data);
    }
    // ネットワークエラーなど
    throw new ApiError('NETWORK_ERROR', 'Network error occurred', error.message);
  }
);

export default apiClient;