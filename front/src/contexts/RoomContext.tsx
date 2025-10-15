import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  isReady: boolean;
  isHost: boolean;
}

export interface Room {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
  status: 'waiting' | 'in-progress' | 'finished';
  isPublic: boolean;
  cardCount: number;
  timeLimit: number;
  description: string;
  createdBy: string;
  createdAt: string;
  participants: Participant[];
}

interface RoomContextType {
  currentRoom: Room | null;
  rooms: Room[];
  isLoading: boolean;
  error: string | null;
  
  // Room operations
  createRoom: (settings: RoomSettings) => Promise<Room>;
  joinRoom: (roomId: string, player: { name: string; avatar: string }) => Promise<boolean>;
  leaveRoom: (roomId: string, playerId: string) => Promise<void>;
  updatePlayerReady: (roomId: string, playerId: string, isReady: boolean) => Promise<void>;
  startGame: (roomId: string) => Promise<boolean>;
  
  // Data operations
  loadRooms: () => Promise<void>;
  loadCurrentRoom: () => void;
  clearCurrentRoom: () => void;
}

interface RoomSettings {
  name: string;
  maxPlayers: number;
  cardCount: number;
  timeLimit: number;
  isPublic: boolean;
  description: string;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};

interface RoomProviderProps {
  children: ReactNode;
}

export const RoomProvider: React.FC<RoomProviderProps> = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初期化
  useEffect(() => {
    loadRooms();
    loadCurrentRoom();
  }, []);

  const loadRooms = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // LocalStorageから全ルーム情報を読み込み
      const storedRooms = localStorage.getItem('rooms');
      if (storedRooms) {
        const parsedRooms = JSON.parse(storedRooms);
        setRooms(parsedRooms);
      } else {
        setRooms([]);
      }
    } catch (err) {
      setError('ルーム一覧の読み込みに失敗しました');
      console.error('Failed to load rooms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentRoom = (): void => {
    try {
      const storedCurrentRoom = localStorage.getItem('currentRoom');
      if (storedCurrentRoom) {
        const parsedRoom = JSON.parse(storedCurrentRoom);
        setCurrentRoom(parsedRoom);
      }
    } catch (err) {
      console.error('Failed to load current room:', err);
    }
  };

  const clearCurrentRoom = (): void => {
    setCurrentRoom(null);
    localStorage.removeItem('currentRoom');
  };

  const generateRoomCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const createRoom = async (settings: RoomSettings): Promise<Room> => {
    setIsLoading(true);
    setError(null);

    try {
      const roomCode = generateRoomCode();
      
      // 現在のプレイヤー情報を取得（PlayerContextから）
      const playerData = localStorage.getItem('player');
      if (!playerData) {
        throw new Error('プレイヤー情報が見つかりません');
      }
      
      const player = JSON.parse(playerData);
      
      const newRoom: Room = {
        id: roomCode,
        name: settings.name,
        players: 1,
        maxPlayers: settings.maxPlayers,
        status: 'waiting',
        isPublic: settings.isPublic,
        cardCount: settings.cardCount,
        timeLimit: settings.timeLimit,
        description: settings.description,
        createdBy: player.name,
        createdAt: new Date().toISOString(),
        participants: [
          {
            id: player.name,
            name: player.name,
            avatar: player.avatar,
            isReady: false,
            isHost: true,
          }
        ]
      };

      // LocalStorageに保存
      const updatedRooms = [...rooms, newRoom];
      localStorage.setItem('rooms', JSON.stringify(updatedRooms));
      localStorage.setItem('currentRoom', JSON.stringify(newRoom));

      // 状態を更新
      setRooms(updatedRooms);
      setCurrentRoom(newRoom);

      return newRoom;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ルームの作成に失敗しました';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async (roomId: string, player: { name: string; avatar: string }): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const targetRoom = rooms.find(room => room.id === roomId);
      if (!targetRoom) {
        throw new Error('指定されたルームが見つかりません');
      }

      if (targetRoom.participants.length >= targetRoom.maxPlayers) {
        throw new Error('ルームが満員です');
      }

      if (targetRoom.status !== 'waiting') {
        throw new Error('ルームはゲーム中または終了しています');
      }

      // 既に参加しているかチェック
      const isAlreadyJoined = targetRoom.participants.some(p => p.id === player.name);
      if (isAlreadyJoined) {
        // 既に参加している場合は current room として設定するだけ
        setCurrentRoom(targetRoom);
        localStorage.setItem('currentRoom', JSON.stringify(targetRoom));
        return true;
      }

      // 新しい参加者を追加
      const updatedRoom: Room = {
        ...targetRoom,
        players: targetRoom.players + 1,
        participants: [
          ...targetRoom.participants,
          {
            id: player.name,
            name: player.name,
            avatar: player.avatar,
            isReady: false,
            isHost: false,
          }
        ]
      };

      // LocalStorageを更新
      const updatedRooms = rooms.map(room => 
        room.id === roomId ? updatedRoom : room
      );
      localStorage.setItem('rooms', JSON.stringify(updatedRooms));
      localStorage.setItem('currentRoom', JSON.stringify(updatedRoom));

      // 状態を更新
      setRooms(updatedRooms);
      setCurrentRoom(updatedRoom);

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ルームへの参加に失敗しました';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const leaveRoom = async (roomId: string, playerId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const targetRoom = rooms.find(room => room.id === roomId);
      if (!targetRoom) {
        throw new Error('指定されたルームが見つかりません');
      }

      const participantToRemove = targetRoom.participants.find(p => p.id === playerId);
      if (!participantToRemove) {
        throw new Error('指定されたプレイヤーはルームに参加していません');
      }

      // ホストが退出する場合の処理
      if (participantToRemove.isHost) {
        // 他の参加者がいる場合は新しいホストを選出
        const otherParticipants = targetRoom.participants.filter(p => p.id !== playerId);
        if (otherParticipants.length > 0) {
          otherParticipants[0].isHost = true;
        }
      }

      const updatedRoom: Room = {
        ...targetRoom,
        players: targetRoom.players - 1,
        participants: targetRoom.participants.filter(p => p.id !== playerId)
      };

      // ルームが空になった場合はルームを削除
      let updatedRooms: Room[];
      if (updatedRoom.participants.length === 0) {
        updatedRooms = rooms.filter(room => room.id !== roomId);
      } else {
        updatedRooms = rooms.map(room => 
          room.id === roomId ? updatedRoom : room
        );
      }

      // LocalStorageを更新
      localStorage.setItem('rooms', JSON.stringify(updatedRooms));

      // 退出したプレイヤーの current room をクリア
      if (currentRoom?.id === roomId) {
        const currentParticipant = currentRoom.participants.find(p => p.id === playerId);
        if (currentParticipant) {
          clearCurrentRoom();
        }
      }

      // 状態を更新
      setRooms(updatedRooms);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ルームからの退出に失敗しました';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlayerReady = async (roomId: string, playerId: string, isReady: boolean): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const targetRoom = rooms.find(room => room.id === roomId);
      if (!targetRoom) {
        throw new Error('指定されたルームが見つかりません');
      }

      const updatedRoom: Room = {
        ...targetRoom,
        participants: targetRoom.participants.map(p => 
          p.id === playerId ? { ...p, isReady } : p
        )
      };

      // LocalStorageを更新
      const updatedRooms = rooms.map(room => 
        room.id === roomId ? updatedRoom : room
      );
      localStorage.setItem('rooms', JSON.stringify(updatedRooms));

      // Current room も更新
      if (currentRoom?.id === roomId) {
        setCurrentRoom(updatedRoom);
        localStorage.setItem('currentRoom', JSON.stringify(updatedRoom));
      }

      // 状態を更新
      setRooms(updatedRooms);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '準備状態の更新に失敗しました';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const startGame = async (roomId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const targetRoom = rooms.find(room => room.id === roomId);
      if (!targetRoom) {
        throw new Error('指定されたルームが見つかりません');
      }

      // 開始条件をチェック
      if (targetRoom.participants.length < 2) {
        throw new Error('最低2人の参加者が必要です');
      }

      const allReady = targetRoom.participants.every(p => p.isReady || p.isHost);
      if (!allReady) {
        throw new Error('全員の準備が完了していません');
      }

      const updatedRoom: Room = {
        ...targetRoom,
        status: 'in-progress'
      };

      // LocalStorageを更新
      const updatedRooms = rooms.map(room => 
        room.id === roomId ? updatedRoom : room
      );
      localStorage.setItem('rooms', JSON.stringify(updatedRooms));

      // Current room も更新
      if (currentRoom?.id === roomId) {
        setCurrentRoom(updatedRoom);
        localStorage.setItem('currentRoom', JSON.stringify(updatedRoom));
      }

      // 状態を更新
      setRooms(updatedRooms);

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ゲームの開始に失敗しました';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: RoomContextType = {
    currentRoom,
    rooms,
    isLoading,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    updatePlayerReady,
    startGame,
    loadRooms,
    loadCurrentRoom,
    clearCurrentRoom,
  };

  return (
    <RoomContext.Provider value={contextValue}>
      {children}
    </RoomContext.Provider>
  );
};

export default RoomContext;