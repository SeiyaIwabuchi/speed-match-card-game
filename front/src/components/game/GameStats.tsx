import React from 'react';
import { Card } from '../ui';
import type { GameStats as GameStatsType, Player } from '../../contexts/GameContext';

export interface GameStatsProps {
  stats: GameStatsType;
  players: Player[];
}

const GameStats: React.FC<GameStatsProps> = ({ stats, players }) => {
  // プレイ時間を分:秒形式にフォーマット
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 最もアクティブなプレイヤーを見つける
  const mostActivePlayer = players.reduce((prev, current) => {
    const prevActions = stats.playerActions[prev.id] || 0;
    const currentActions = stats.playerActions[current.id] || 0;
    return currentActions > prevActions ? current : prev;
  }, players[0]);

  const totalActions = Object.values(stats.playerActions).reduce((sum, count) => sum + count, 0);

  return (
    <Card variant="elevated">
      <div className="p-4">
        <h3 className="font-bold mb-4 text-center">ゲーム統計</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 総ターン数 */}
          <div className="text-center p-3 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg">
            <div className="text-sm text-secondary mb-1">総ターン数</div>
            <div className="text-2xl font-bold text-primary-600">{stats.totalTurns}</div>
          </div>

          {/* プレイ時間 */}
          <div className="text-center p-3 bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg">
            <div className="text-sm text-secondary mb-1">プレイ時間</div>
            <div className="text-2xl font-bold text-secondary-600">{formatTime(stats.playTime)}</div>
          </div>

          {/* 総アクション数 */}
          <div className="text-center p-3 bg-gradient-to-br from-success-50 to-success-100 rounded-lg">
            <div className="text-sm text-secondary mb-1">総アクション数</div>
            <div className="text-2xl font-bold text-success-600">{totalActions}</div>
          </div>
        </div>

        {/* プレイヤー別アクション数 */}
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium text-secondary mb-2">プレイヤー別アクション数</div>
          {players.map((player) => {
            const actions = stats.playerActions[player.id] || 0;
            const percentage = totalActions > 0 ? (actions / totalActions) * 100 : 0;
            const isMostActive = player.id === mostActivePlayer.id && totalActions > 0;

            return (
              <div key={player.id} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isMostActive 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-primary-100 text-primary-600'
                    }`}>
                      {player.avatar}
                    </div>
                    <span className="text-sm">{player.name}</span>
                    {isMostActive && (
                      <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                        最多
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium">{actions} アクション</span>
                </div>
                {/* プログレスバー */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      isMostActive ? 'bg-primary-500' : 'bg-primary-300'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 追加情報 */}
        {stats.totalTurns > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
            <div className="text-xs text-secondary">
              平均ターン時間: <span className="font-medium text-gray-700">
                {formatTime(Math.floor(stats.playTime / stats.totalTurns))}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default GameStats;
