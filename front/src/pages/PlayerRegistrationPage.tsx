import React, { useState } from 'react';
import { Container, Header, Footer, Card, Button, Input } from '../components';
import { usePlayer } from '../contexts';

interface PlayerRegistrationPageProps {
  onNavigate?: (page: string) => void;
  onRegistrationComplete?: () => void;
}

interface FormData {
  name: string;
  avatar: string;
}

interface FormErrors {
  name?: string;
  avatar?: string;
}

const PlayerRegistrationPage: React.FC<PlayerRegistrationPageProps> = ({ 
  onNavigate, 
  onRegistrationComplete 
}) => {
  const { setPlayer } = usePlayer();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    avatar: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // プリセットアバターリスト
  const presetAvatars = [
    '🎮', '⚡', '🚀', '🎯', '🔥', '💎', '🌟', '⭐', 
    '🎨', '🎵', '🏆', '👑', '🦄', '🐉', '🌈', '💫'
  ];

  // バリデーション関数
  const validateForm = (data: FormData): FormErrors => {
    const newErrors: FormErrors = {};

    // 名前のバリデーション
    if (!data.name.trim()) {
      newErrors.name = 'プレイヤー名を入力してください';
    } else if (data.name.trim().length < 2) {
      newErrors.name = 'プレイヤー名は2文字以上で入力してください';
    } else if (data.name.trim().length > 20) {
      newErrors.name = 'プレイヤー名は20文字以内で入力してください';
    } else if (!/^[a-zA-Z0-9あ-んア-ヶ一-龯ー\s]+$/.test(data.name.trim())) {
      newErrors.name = '使用できない文字が含まれています';
    }

    // アバターのバリデーション
    if (!data.avatar) {
      newErrors.avatar = 'アバターを選択してください';
    }

    return newErrors;
  };

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      try {
        // プレイヤー情報を保存
        const newPlayer = {
          name: formData.name.trim(),
          avatar: formData.avatar,
          wins: 0,
          totalGames: 0
        };

        setPlayer(newPlayer);
        
        // 登録完了の処理
        if (onRegistrationComplete) {
          onRegistrationComplete();
        } else if (onNavigate) {
          onNavigate('home');
        }

      } catch (error) {
        console.error('Registration failed:', error);
        setErrors({ name: '登録に失敗しました。もう一度お試しください。' });
      }
    }

    setIsSubmitting(false);
  };

  // 入力値変更ハンドラ
  const handleInputChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // アバター選択ハンドラ
  const handleAvatarSelect = (avatar: string) => {
    setFormData(prev => ({
      ...prev,
      avatar
    }));
    
    // エラーをクリア
    if (errors.avatar) {
      setErrors(prev => ({
        ...prev,
        avatar: undefined
      }));
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-gradient)' }}>
      <Container size="md" variant="gradient">
        <Header title="プレイヤー登録" showNavigation={false} />
        
        <main className="py-8">
          <Card variant="elevated" className="max-w-2xl mx-auto">
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-4">スピードマッチへようこそ！</h1>
                <p className="text-lg text-secondary">
                  ゲームを始める前に、あなたのプレイヤー情報を設定しましょう
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* プレイヤー名入力 */}
                <div>
                  <label htmlFor="playerName" className="block text-sm font-medium mb-2">
                    プレイヤー名 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="playerName"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    placeholder="あなたの名前を入力してください"
                    error={errors.name}
                    disabled={isSubmitting}
                    maxLength={20}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    2〜20文字、日本語・英数字が使用できます
                  </p>
                </div>

                {/* アバター選択 */}
                <div>
                  <label className="block text-sm font-medium mb-4">
                    アバターを選択 <span className="text-red-500">*</span>
                  </label>
                  
                  {/* プリセットアバター */}
                  <div className="mb-4">
                    <p className="text-sm text-secondary mb-3">プリセットから選択：</p>
                    <div className="grid grid-cols-8 gap-2">
                      {presetAvatars.map((avatar, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleAvatarSelect(avatar)}
                          className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-xl transition-all ${
                            formData.avatar === avatar
                              ? 'border-primary-500 bg-primary-50 scale-110'
                              : 'border-gray-200 hover:border-primary-300 hover:bg-primary-25'
                          }`}
                          disabled={isSubmitting}
                        >
                          {avatar}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* カスタムアバター入力 */}
                  <div>
                    <p className="text-sm text-secondary mb-2">または1文字で入力：</p>
                    <Input
                      type="text"
                      value={formData.avatar.length === 1 && !presetAvatars.includes(formData.avatar) ? formData.avatar : ''}
                      onChange={(e) => {
                        const value = e.target.value.slice(0, 1);
                        if (value) {
                          handleAvatarSelect(value);
                        }
                      }}
                      placeholder="例: A, 太, ☆"
                      maxLength={1}
                      disabled={isSubmitting}
                      className="w-20 text-center"
                    />
                  </div>
                  
                  {errors.avatar && (
                    <p className="text-red-500 text-sm mt-2">{errors.avatar}</p>
                  )}
                </div>

                {/* プレビュー */}
                {formData.avatar && (
                  <div className="bg-primary-25 rounded-lg p-4">
                    <p className="text-sm font-medium mb-3">プレビュー：</p>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl border-2 border-primary-200">
                        {formData.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">
                          {formData.name || 'プレイヤー名'}
                        </p>
                        <p className="text-sm text-secondary">スピードマッチプレイヤー</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 送信ボタン */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '登録中...' : 'ゲームを始める'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </main>

        <Footer />
      </Container>
    </div>
  );
};

export default PlayerRegistrationPage;