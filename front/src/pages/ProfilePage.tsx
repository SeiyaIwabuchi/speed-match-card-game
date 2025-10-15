import React, { useState } from 'react';
import { Container, Header, Footer, Card, Button, Input } from '../components';

interface ProfilePageProps {
  onNavigate?: (page: string) => void;
  player?: {
    name: string;
    avatar?: string;
    wins?: number;
    totalGames?: number;
  } | null;
  onPlayerUpdate?: (player: any) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ 
  onNavigate, 
  player = { name: 'Guest', wins: 0, totalGames: 0 },
  onPlayerUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: player?.name || '',
    avatar: player?.avatar || ''
  });

  const winRate = ((player?.totalGames || 0) > 0) ? (((player?.wins || 0) / (player?.totalGames || 1)) * 100).toFixed(1) : '0.0';

  const handleSave = () => {
    if (!player) return;
    
    const updatedPlayer = {
      ...player,
      name: editForm.name,
      avatar: editForm.avatar
    };
    
    if (onPlayerUpdate) {
      onPlayerUpdate(updatedPlayer);
    }
    
    setIsEditing(false);
    console.log('Profile updated:', updatedPlayer);
  };

  const handleCancel = () => {
    setEditForm({
      name: player?.name || '',
      avatar: player?.avatar || ''
    });
    setIsEditing(false);
  };

  const stats = [
    { label: '総ゲーム数', value: player?.totalGames || 0 },
    { label: '勝利数', value: player?.wins || 0 },
    { label: '勝率', value: `${winRate}%` },
    { label: '連勝記録', value: 3 }, // TODO: 実装予定
  ];

  const achievements = [
    { name: '初勝利', description: '初めて勝利を収める', unlocked: (player?.wins || 0) > 0 },
    { name: 'ベテラン', description: '10試合プレイする', unlocked: (player?.totalGames || 0) >= 10 },
    { name: '勝利者', description: '勝率50%以上を達成', unlocked: parseFloat(winRate) >= 50 },
    { name: 'スピードマスター', description: '連続5勝を達成', unlocked: false }, // TODO: 実装予定
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-gradient)' }}>
      <Container size="lg" variant="gradient">
        <Header 
          title="プロフィール"
          player={player || undefined}
          showNavigation={true}
          onNavigate={onNavigate}
        />
        
        <main>
          <div className="grid gap-6">
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
                      >
                        保存
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={handleCancel}
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map((stat, index) => (
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