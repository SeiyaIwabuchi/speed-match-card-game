import React, { useEffect, useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Header, Footer, Card, Button } from '../components';
import { GameProvider, useGame } from '../contexts';
import { PlayerContext } from '../contexts';
import { GameBoard, PlayerHand, PlayerList, GameActions, type CardDTO } from '../components/game';

interface GamePageProps {
  onNavigate?: (page: string) => void;
}

// ゲーム画面のメインコンポーネント
const GamePageContent: React.FC<GamePageProps> = ({ onNavigate }) => {
  const { gameId } = useParams<{ gameId: string }>();
  const { player } = useContext(PlayerContext) || {};
  const { gameState, loading, error, isPlayerTurn, fetchGameState, clearError, handlePlayCard, handleDrawCard, handleSkipTurn } = useGame();
  
  // 選択されたカード（GameBoardからの操作用）- フックは最上位で呼び出し
  const [selectedCardForBoard, setSelectedCardForBoard] = useState<CardDTO | null>(null);

  // Player型をPlayerInfo型に変換
  const playerInfo = player ? {
    name: player.name,
    avatar: player.avatar,
    wins: player.wins,
    totalGames: player.totalGames
  } : undefined;

  // 初回ロード時にゲーム状態を取得
  useEffect(() => {
    if (gameId) {
      fetchGameState();
    }
  }, [gameId]);

  // ゲーム状態の定期更新（5秒ごと、ゲーム中のみ）
  useEffect(() => {
    if (!gameState.gameId || gameState.status !== 'PLAYING') {
      return;
    }

    let isMounted = true;
    console.log('GamePage: Starting game state polling');
    const interval = setInterval(() => {
      if (isMounted) {
        fetchGameState();
      }
    }, 5000);

    return () => {
      console.log('GamePage: Stopping game state polling');
      isMounted = false;
      clearInterval(interval);
    };
  }, [gameState.gameId, gameState.status]);

  const handleLeaveGame = () => {
    if (onNavigate) {
      onNavigate('rooms');
    }
  };

  // ローディング画面（初回のみ）
  if (loading && !gameState.gameId) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-background-gradient)' }}>
        <Container size="lg" variant="gradient">
          <Header 
            title="ゲーム"
            player={playerInfo}
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

  // ゲーム終了画面
  if (gameState.status === 'FINISHED') {
    console.log('Game finished. gameState.players:', gameState.players);
    console.log('Looking for rank 1...');
    const winner = gameState.players.find(p => p.rank === 1);
    console.log('Winner found:', winner);
    console.log('Current player:', player);
    console.log('player.id:', player?.id);
    console.log('player.name:', player?.name);
    const isWinner = winner?.id === player?.id || winner?.id === player?.name;
    
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-background-gradient)' }}>
        <Container size="lg" variant="gradient">
          <Header 
            title="ゲーム終了"
            player={playerInfo}
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
                  {isWinner ? 'あなたの勝利です！' : winner ? `勝者: ${winner.id}` : 'ゲーム結果取得中...'}
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
            player={playerInfo}
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

  // 他のプレイヤー一覧
  const otherPlayers = gameState.players.filter(p => p.id !== player?.id).map(p => ({
    id: p.id,
    name: `Player ${p.id.slice(0, 8)}`, // 仮の名前表示
    handCount: p.handSize,
    isCurrentPlayer: p.id === gameState.currentPlayerId,
    isConnected: true // 仮定
  }));

  // ゲーム中画面
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-gradient)' }}>
      <Container size="lg" variant="gradient">
        <Header
          title="ゲーム中"
          player={playerInfo}
          showNavigation={false}
        />

        <main className="py-6 space-y-6">
          {/* エラー通知 */}
          {error && (
            <Card variant="elevated" className="p-4 bg-red-50 border-red-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-red-800 mb-1">エラーが発生しました</h3>
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => { clearError(); fetchGameState(); }} disabled={loading}>
                    再試行
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearError}>
                    閉じる
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* デバッグ情報 */}
          <Card variant="elevated" className="p-4 bg-yellow-50 border-yellow-200">
            <h3 className="text-sm font-bold text-yellow-800 mb-2">デバッグ情報</h3>
            <div className="text-xs text-yellow-700 space-y-1">
              <div>場札1: {gameState.fieldCards?.first.suit} {gameState.fieldCards?.first.rank}</div>
              <div>場札2: {gameState.fieldCards?.second.suit} {gameState.fieldCards?.second.rank}</div>
              <div>プレイ可能なカード: {gameState.playableCards?.length || 0}枚</div>
              <div>ターン: {isPlayerTurn() ? 'あなた' : '相手'}</div>
              <div>ステータス: {gameState.status}</div>
            </div>
          </Card>

          {/* 場札 */}
          <GameBoard
            fieldCards={gameState.fieldCards}
            playableCards={gameState.playableCards || []}
            selectedCard={selectedCardForBoard}
            onFieldClick={(fieldIndex) => {
              if (selectedCardForBoard) {
                handlePlayCard(selectedCardForBoard, fieldIndex);
                setSelectedCardForBoard(null);
              }
            }}
          />

          {/* 自分の手札とアクション */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlayerHand
              hand={myHand}
              playableCards={gameState.playableCards || []}
              fieldCards={gameState.fieldCards}
              onCardSelect={setSelectedCardForBoard}
              onCardPlay={handlePlayCard}
              isPlayerTurn={isPlayerTurn()}
            />

            <GameActions
              onDrawCard={handleDrawCard}
              onSkipTurn={handleSkipTurn}
              canDrawCard={isPlayerTurn() && gameState.deckRemaining > 0}
              canSkipTurn={isPlayerTurn()}
              isPlayerTurn={isPlayerTurn()}
              isLoading={loading}
            />
          </div>

          {/* プレイヤーリスト */}
          <PlayerList
            players={otherPlayers}
            currentPlayerId={player?.id || ''}
          />

          {/* ゲーム情報 */}
          <Card variant="elevated" className="p-4">
            <div className="flex justify-between items-center text-sm text-secondary">
              <span>ゲームID: {gameState.gameId}</span>
              <span>残りカード: {gameState.deckRemaining}枚</span>
              <Button variant="secondary" size="sm" onClick={fetchGameState} disabled={loading}>
                更新
              </Button>
              <Button variant="secondary" size="sm" onClick={handleLeaveGame}>
                退出
              </Button>
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