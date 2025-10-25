import React, { useState, useContext } from 'react';
import { Container, Header, Footer, Card, Button, Input } from '../components';
import { PlayerContext } from '../contexts';
import { createRoom } from '../api/room';
import { useApiError } from '../hooks/useApiError';

interface CreateRoomPageProps {
  onNavigate?: (path: string) => void;
}

interface RoomSettings {
  name: string;
  maxPlayers: number;
  cardCount: number;
  timeLimit: number;
  isPublic: boolean;
  description: string;
}

const CreateRoomPage: React.FC<CreateRoomPageProps> = ({ onNavigate }) => {
  const { player } = useContext(PlayerContext) || {};
  const { handleApiCall } = useApiError();
  const [settings, setSettings] = useState<RoomSettings>({
    name: '',
    maxPlayers: 4,
    cardCount: 7,
    timeLimit: 30,
    isPublic: true,
    description: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateSettings = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!settings.name.trim()) {
      newErrors.name = 'ルーム名を入力してください';
    } else if (settings.name.length > 50) {
      newErrors.name = 'ルーム名は50文字以内で入力してください';
    }

    if (settings.maxPlayers < 2 || settings.maxPlayers > 4) {
      newErrors.maxPlayers = 'プレイヤー数は2〜4人で設定してください';
    }

    if (settings.cardCount < 5 || settings.cardCount > 13) {
      newErrors.cardCount = 'カード枚数は5〜13枚で設定してください';
    }

    if (settings.timeLimit < 10 || settings.timeLimit > 60) {
      newErrors.timeLimit = '制限時間は10〜60秒で設定してください';
    }

    if (settings.description && settings.description.length > 200) {
      newErrors.description = '説明は200文字以内で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateRoom = async () => {
    if (!validateSettings()) {
      return;
    }

    if (!player) {
      alert('プレイヤー情報が見つかりません。プロフィールページから登録してください。');
      return;
    }

    setIsCreating(true);

    try {
      await handleApiCall(
        () => createRoom({
          roomName: settings.name,
          maxPlayers: settings.maxPlayers,
          initialHandSize: settings.cardCount,
          turnTimeLimit: settings.timeLimit === 30 ? 30 : settings.timeLimit === 60 ? 60 : 0,
          isPublic: settings.isPublic,
          hostId: player.id,
        }),
        (result) => {
          console.log('Room created:', result);
          // 待機画面に遷移
          if (onNavigate) {
            onNavigate(`waiting-room/${result.roomCode}`);
          }
        },
        (error) => {
          console.error('Failed to create room:', error);
          alert(`ルームの作成に失敗しました: ${error.message}`);
        }
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    if (onNavigate) {
      onNavigate('rooms');
    }
  };

  const handleInputChange = (field: keyof RoomSettings, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));

    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-gradient)' }}>
      <Container size="xl" variant="gradient">
        <Header>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">新しいルームを作成</h1>
            {player && (
              <div className="flex items-center gap-3 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                    {player.avatar}
                  </div>
                  <span className="font-medium">{player.name}</span>
                </div>
              </div>
            )}
          </div>
        </Header>

        <main className="flex-1 py-8">
          <div className="max-w-2xl mx-auto">
            <Card variant="elevated" className="p-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateRoom();
                }}
                className="space-y-6"
              >
                {/* ルーム名 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ルーム名 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="楽しいルーム"
                    value={settings.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* 説明（オプション） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ルーム説明（任意）
                  </label>
                  <textarea
                    placeholder="ルームの説明を入力してください"
                    value={settings.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                {/* ゲーム設定 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 最大参加人数 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最大参加人数
                    </label>
                    <select
                      value={settings.maxPlayers}
                      onChange={(e) => handleInputChange('maxPlayers', parseInt(e.target.value))}
                      className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.maxPlayers ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {[2, 3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>{num}人</option>
                      ))}
                    </select>
                    {errors.maxPlayers && (
                      <p className="text-red-500 text-sm mt-1">{errors.maxPlayers}</p>
                    )}
                  </div>

                  {/* 手札枚数 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      手札枚数
                    </label>
                    <select
                      value={settings.cardCount}
                      onChange={(e) => handleInputChange('cardCount', parseInt(e.target.value))}
                      className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.cardCount ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {[5, 6, 7, 8, 9, 10, 11, 12, 13].map(num => (
                        <option key={num} value={num}>{num}枚</option>
                      ))}
                    </select>
                    {errors.cardCount && (
                      <p className="text-red-500 text-sm mt-1">{errors.cardCount}</p>
                    )}
                  </div>

                  {/* 制限時間 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      制限時間（秒）
                    </label>
                    <select
                      value={settings.timeLimit}
                      onChange={(e) => handleInputChange('timeLimit', parseInt(e.target.value))}
                      className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.timeLimit ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {[10, 15, 20, 30, 45, 60, 90, 120].map(num => (
                        <option key={num} value={num}>{num}秒</option>
                      ))}
                    </select>
                    {errors.timeLimit && (
                      <p className="text-red-500 text-sm mt-1">{errors.timeLimit}</p>
                    )}
                  </div>
                </div>

                {/* 公開設定 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    公開設定
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isPublic"
                        checked={settings.isPublic}
                        onChange={() => handleInputChange('isPublic', true)}
                        className="mr-2"
                      />
                      <span>公開ルーム（誰でも参加可能）</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isPublic"
                        checked={!settings.isPublic}
                        onChange={() => handleInputChange('isPublic', false)}
                        className="mr-2"
                      />
                      <span>プライベートルーム（コードが必要）</span>
                    </label>
                  </div>
                </div>

                {/* ボタン */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={handleCancel}
                    disabled={isCreating}
                    className="flex-1"
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isCreating}
                    className="flex-1"
                  >
                    {isCreating ? 'ルーム作成中...' : 'ルームを作成'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </main>

        <Footer />
      </Container>
    </div>
  );
};

export default CreateRoomPage;