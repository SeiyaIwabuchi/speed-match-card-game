import React, { useState, useEffect } from 'react';
import { Container, Header, Footer, Card, Button, Input, ErrorMessage } from '../components';
import { usePlayer } from '../contexts';
import { useApiError } from '../hooks/useApiError';
import { updatePlayer, getPlayerStats } from '../api/player';

interface ProfilePageProps {
  onNavigate?: (page: string) => void;
  player?: {
    id?: string;
    name: string;
    avatar?: string;
    wins?: number;
    totalGames?: number;
  } | null;
  onPlayerUpdate?: (updates: Partial<{
    id?: string;
    name: string;
    avatar?: string;
    wins?: number;
    totalGames?: number;
  }>) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ 
  onNavigate
}) => {
  const { player, updatePlayer: updatePlayerContext } = usePlayer();
  const { hasError, error, clearError, handleApiCall } = useApiError();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: player?.name || '',
    avatar: player?.avatar || ''
  });
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    fastestWin: null as number | null,
    totalCardsPlayed: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!player?.id) return;

    setIsSubmitting(true);
    await handleApiCall(
      () => updatePlayer(player.id!, {
        username: editForm.name,
        avatar: editForm.avatar
      }),
      (updatedPlayerData) => {
        // APIレスポンスをPlayerContextの形式に変換
        const updatedPlayer = {
          ...player,
          name: updatedPlayerData.username,
          avatar: updatedPlayerData.avatar
        };
        
        updatePlayerContext(updatedPlayer);
        setIsEditing(false);
        console.log('Profile updated:', updatedPlayer);
      }
    );
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    setEditForm({
      name: player?.name || '',
      avatar: player?.avatar || ''
    });
    setIsEditing(false);
  };

  const winRate = ((stats.totalGames || 0) > 0) ? (((stats.wins || 0) / (stats.totalGames || 1)) * 100).toFixed(1) : '0.0';

  // 統計情報をAPIから取得
  useEffect(() => {
    const loadStats = async () => {
      if (player?.id) {
        setIsLoadingStats(true);
        await handleApiCall(
          () => getPlayerStats(player.id!),
          (statsData) => {
            setStats({
              totalGames: statsData.totalGames,
              wins: statsData.totalWins,
              losses: statsData.totalLosses,
              fastestWin: statsData.fastestWin,
              totalCardsPlayed: statsData.totalCardsPlayed
            });
          }
        );
        setIsLoadingStats(false);
      }
    };
    
    loadStats();
  }, [player?.id, handleApiCall]);

  const displayStats = [
    { label: '総ゲーム数', value: stats.totalGames || 0 },
    { label: '勝利数', value: stats.wins || 0 },
    { label: '勝率', value: `${winRate}%` },
    { label: '最速勝利', value: stats.fastestWin ? `${stats.fastestWin}ターン` : '未達成' },
  ];

  const achievements = [
    { name: '初勝利', description: '初めて勝利を収める', unlocked: (player?.wins || 0) > 0 },
    { name: 'ベテラン', description: '10試合プレイする', unlocked: (player?.totalGames || 0) >= 10 },
    { name: '勝利者', description: '勝率50%以上を達成', unlocked: parseFloat(winRate) >= 50 },
    { name: 'スピードマスター', description: '連続5勝を達成', unlocked: false }, // TODO: 実装予定
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-light-blue)' }}>
      <Container size="lg">
        <Header 
          title="プロフィール"
          player={player || undefined}
          showNavigation={true}
          onNavigate={onNavigate}
        />
        
        <main>
          <div className="grid gap-6">
            {/* エラーメッセージ表示 */}
            {hasError && (
              <ErrorMessage
                error={error}
                onClose={clearError}
              />
            )}
            {/* プロフィール情報 */}
            <Card variant="elevated">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold">プレイヤー情報</h2>
                  {!isEditing ? (
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      編集
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={handleSave}
                        loading={isSubmitting}
                        disabled={isSubmitting}
                      >
                        保存
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                      >
                        キャンセル
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-600">
                    {player?.avatar || player?.name?.charAt(0).toUpperCase() || 'G'}
                  </div>
                  
                  <div className="flex-1">
                    {!isEditing ? (
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{player?.name || 'Guest'}</h3>
                        <p className="text-secondary">
                          スピードマッチプレイヤー
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">プレイヤー名</label>
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="プレイヤー名を入力"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">アバター（1文字）</label>
                          <Input
                            value={editForm.avatar}
                            onChange={(e) => setEditForm(prev => ({ ...prev, avatar: e.target.value.slice(0, 1) }))}
                            placeholder="アバター文字を入力"
                            maxLength={1}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* 統計情報 */}
            <Card variant="elevated">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">プレイ統計</h3>
                {isLoadingStats ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-secondary">統計情報を読み込み中...</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {displayStats.map((stat, index) => (
                      <div key={index} className="text-center p-4 bg-background-secondary rounded-lg">
                        <div className="text-2xl font-bold text-primary-600 mb-1">
                          {stat.value}
                        </div>
                        <div className="text-sm text-secondary">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* 実績 */}
            <Card variant="elevated">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">実績</h3>
                <div className="grid gap-3">
                  {achievements.map((achievement, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        achievement.unlocked 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-gray-50 border border-gray-200 opacity-60'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        achievement.unlocked 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {achievement.unlocked ? '🏆' : '🔒'}
                      </div>
                      <div>
                        <h4 className="font-semibold">{achievement.name}</h4>
                        <p className="text-sm text-secondary">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* アクション */}
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => onNavigate?.('home')}
              >
                ホームに戻る
              </Button>
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => onNavigate?.('rooms')}
              >
                ゲームを開始
              </Button>
              
              {/* デバッグ用リセット機能 */}
              <Button 
                variant="error" 
                size="sm"
                onClick={() => {
                  if (confirm('アカウントデータをリセットしますか？この操作は元に戻せません。')) {
                    localStorage.removeItem('speedmatch-player');
                    window.location.reload();
                  }
                }}
              >
                データリセット（デバッグ用）
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </Container>
    </div>
  );
};

export default ProfilePage;