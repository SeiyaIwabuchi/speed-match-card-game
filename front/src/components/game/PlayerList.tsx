import React from 'react';
import { Card } from '../ui';

export interface PlayerDTO {
  id: string;
  name: string;
  handCount: number; // 手札の枚数
  isCurrentPlayer: boolean;
  isConnected: boolean;
}

export interface PlayerListProps {
  players: PlayerDTO[];
  currentPlayerId: string;
  className?: string;
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  currentPlayerId,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <Card variant="elevated" className="p-6">
        <h3 className="text-lg font-bold mb-4">プレイヤー一覧</h3>

        {players.length === 0 ? (
          <p className="text-secondary">プレイヤーがいません</p>
        ) : (
          <div className="space-y-3">
            {players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  player.id === currentPlayerId
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    player.isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-secondary">
                      手札: {player.handCount}枚
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {player.isCurrentPlayer && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                      現在のターン
                    </span>
                  )}
                  {player.id === currentPlayerId && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      あなた
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default PlayerList;