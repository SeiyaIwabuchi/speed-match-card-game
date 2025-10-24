import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface Player {
  id?: string;
  name: string;
  avatar?: string;
  token?: string;
  wins?: number;
  totalGames?: number;
}

interface PlayerContextType {
  player: Player | null;
  setPlayer: (player: Player | null) => void;
  updatePlayer: (updates: Partial<Player>) => void;
  isRegistered: boolean;
}

export const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

interface PlayerProviderProps {
  children: ReactNode;
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  const [player, setPlayerState] = useState<Player | null>(null);

  // LocalStorageからプレイヤー情報を読み込み
  useEffect(() => {
    const savedPlayer = localStorage.getItem('speedmatch-player');
    if (savedPlayer) {
      try {
        const parsedPlayer = JSON.parse(savedPlayer);
        setPlayerState(parsedPlayer);
      } catch (error) {
        console.error('Failed to parse saved player data:', error);
        localStorage.removeItem('speedmatch-player');
      }
    }
  }, []);

  // プレイヤー情報をLocalStorageに保存
  useEffect(() => {
    if (player) {
      localStorage.setItem('speedmatch-player', JSON.stringify(player));
    } else {
      localStorage.removeItem('speedmatch-player');
    }
  }, [player]);

  const setPlayer = (newPlayer: Player | null) => {
    setPlayerState(newPlayer);
  };

  const updatePlayer = (updates: Partial<Player>) => {
    if (player) {
      const updatedPlayer = { ...player, ...updates };
      setPlayerState(updatedPlayer);
    }
  };

  const isRegistered = player !== null && player.name.trim() !== '';

  const value: PlayerContextType = {
    player,
    setPlayer,
    updatePlayer,
    isRegistered
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};