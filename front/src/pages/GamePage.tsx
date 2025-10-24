import React, { useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Header, Footer, Card, Button } from '../components';
import { GameProvider, useGame } from '../contexts';
import { PlayerContext } from '../contexts';

interface GamePageProps {
  onNavigate?: (page: string) => void;
}

// ゲーム画面のメインコンポーネント
const GamePageContent: React.FC<GamePageProps> = ({ onNavigate }) => {
  const { gameId } = useParams<{ gameId: string }>();
  const { player } = useContext(PlayerContext) || {};
  const { gameState, loading, error, isPlayerTurn, fetchGameState, clearError } = useGame();

  // 初回ロード時にゲーム状態を取得
  useEffect(() => {
    if (gameId) {
      fetchGameState();
    }
  }, [gameId]);

  // ゲーム終了時にリザルト画面へ遷移
  useEffect(() => {
    if (gameState.status === 'FINISHED' && gameState.gameId && onNavigate) {
      onNavigate(`result/${gameState.gameId}`);
    }
  }, [gameState.status, gameState.gameId, onNavigate]);

  const handleLeaveGame = () => {
    if (onNavigate) {
      onNavigate('rooms');
    }
  };

  // ローディング画面
  if (loading && !gameState.gameId) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-background-gradient)' }}>
        <Container size="lg" variant="gradient">
          <Header 
            title="ゲーム"
            player={player || undefined}
            showNavigation={false}
          />
          
          <main className="text-center py-12">
            <Card variant="elevated" className="max-w-md mx-auto">
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-4">読み込み中...</h2>
                <p className="text-secondary">ゲーム状態を取得しています</p>
              </div>
            </Card>
          </main>

          <Footer />
        </Container>
      </div>
    );
  }

  // エラー画面
  if (error) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-background-gradient)' }}>
        <Container size="lg" variant="gradient">
          <Header 
            title="ゲーム"
            player={player || undefined}
            showNavigation={false}
          />
          
          <main className="text-center py-12">
            <Card variant="elevated" className="max-w-md mx-auto">
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-4 text-red-600">エラー</h2>
                <p className="text-secondary mb-6">{error}</p>
                <div className="space-y-2">
                  <Button onClick={() => { clearError(); fetchGameState(); }} disabled={loading}>
                    再試行
                  </Button>
                  <Button variant="secondary" onClick={handleLeaveGame}>
                    ルーム一覧に戻る
                  </Button>
                </div>
              </div>
            </Card>
          </main>

          <Footer />
        </Container>
      </div>
    );
  }

  // ゲーム終了画面
  if (gameState.status === 'FINISHED') {
    const winner = gameState.players.find(p => p.rank === 1);
    const isWinner = winner?.id === player?.id;
    
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-background-gradient)' }}>
        <Container size="lg" variant="gradient">
          <Header 
            title="ゲーム終了"
            player={player || undefined}
            showNavigation={false}
          />
          
          <main className="text-center py-12">
            <Card variant="elevated" className="max-w-md mx-auto">
              <div className="p-8">
                <div className="text-6xl mb-4">
                  {isWinner ? '🎉' : '😔'}
                </div>
                <h2 className={`text-2xl font-bold mb-4 ${isWinner ? 'text-green-600' : 'text-gray-600'}`}>
                  {isWinner ? 'おめでとうございます！' : 'ゲーム終了'}
                </h2>
                <p className="text-secondary mb-6">
                  {isWinner ? 'あなたの勝利です！' : `勝者: ${winner?.id}`}
                </p>
                <Button variant="secondary" onClick={handleLeaveGame}>
                  ルーム一覧に戻る
                </Button>
              </div>
            </Card>
          </main>

          <Footer />
        </Container>
      </div>
    );
  }

  // ゲーム状態が不完全な場合
  if (!gameState.fieldCards) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-background-gradient)' }}>
        <Container size="lg" variant="gradient">
          <Header 
            title="ゲーム"
            player={player || undefined}
            showNavigation={false}
          />
          
          <main className="text-center py-12">
            <Card variant="elevated" className="max-w-md mx-auto">
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-4">ゲーム準備中...</h2>
                <Button onClick={fetchGameState}>状態を更新</Button>
              </div>
            </Card>
          </main>

          <Footer />
        </Container>
      </div>
    );
  }

  // 自分の手札を取得
  const myPlayerState = gameState.players.find(p => p.id === player?.id);
  const myHand = myPlayerState?.hand || [];

  // ゲーム中画面（実装は次のメッセージで続けます）
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-gradient)' }}>
      <Container size="lg" variant="gradient">
        <Header 
          title="ゲーム中"
          player={player || undefined}
          showNavigation={false}
        />
        
        <main className="py-6">
          <Card variant="elevated">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">ゲーム実装中...</h2>
              <p className="mb-4">ゲームID: {gameState.gameId}</p>
              <p className="mb-4">プレイヤー数: {gameState.players.length}</p>
              <p className="mb-4">あなたの手札: {myHand.length}枚</p>
              <p className="mb-4">ターン: {isPlayerTurn() ? 'あなた' : '他のプレイヤー'}</p>
              <Button onClick={fetchGameState} className="mb-2">状態を更新</Button>
              <Button variant="secondary" onClick={handleLeaveGame}>退出</Button>
            </div>
          </Card>
        </main>

        <Footer />
      </Container>
    </div>
  );
};

// GamePageのラッパーコンポーネント（GameProviderでラップ）
const GamePage: React.FC<GamePageProps> = (props) => {
  const { gameId } = useParams<{ gameId: string }>();
  const { player } = useContext(PlayerContext) || {};

  if (!gameId) {
    return <div>ゲームIDが指定されていません</div>;
  }

  if (!player?.id) {
    return <div>プレイヤー情報が取得できません</div>;
  }

  return (
    <GameProvider gameId={gameId} playerId={player.id}>
      <GamePageContent {...props} />
    </GameProvider>
  );
};

export default GamePage;