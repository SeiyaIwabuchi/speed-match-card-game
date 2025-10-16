import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Header, Footer, Card, Button, GameBoard } from '../components';
import { GameProvider, useGame } from '../contexts';

interface GamePageProps {
  onNavigate?: (page: string) => void;
  player?: {
    name: string;
    avatar?: string;
    wins?: number;
    totalGames?: number;
  } | null;
}

// ゲーム画面のメインコンポーネント
const GamePageContent: React.FC<GamePageProps> = ({ 
  onNavigate, 
  player 
}) => {
  const { roomId = '123456' } = useParams<{ roomId: string }>();
  const { gameState, isPlayerTurn, playCard, leaveGame } = useGame();

  const handleLeaveGame = () => {
    leaveGame();
    if (onNavigate) {
      onNavigate('rooms');
    }
  };

  const handleCardPlay = (card: any) => {
    playCard(card);
  };

  // 待機画面
  if (gameState.gamePhase === 'waiting') {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-background-gradient)' }}>
        <Container size="lg" variant="gradient">
          <Header 
            title={`ルーム ${roomId}`}
            player={player || undefined}
            showNavigation={false}
          />
          
          <main className="text-center py-12">
            <Card variant="elevated" className="max-w-md mx-auto">
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-4">ゲーム開始を待機中...</h2>
                <p className="text-secondary mb-6">
                  他のプレイヤーの参加を待っています
                </p>
                <div className="mb-6">
                  <div className="text-sm text-secondary mb-2">参加プレイヤー</div>
                  <div className="space-y-2">
                    {gameState.players.map((p, _index) => (
                      <div key={p.id} className="flex items-center gap-2 justify-center">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                          {p.avatar}
                        </div>
                        <span>{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button variant="secondary" onClick={handleLeaveGame}>
                  ルームを退出
                </Button>
              </div>
            </Card>
          </main>

          <Footer />
        </Container>
      </div>
    );
  }

  // 勝利画面
  if (gameState.gamePhase === 'finished' && gameState.winner) {
    const isWinner = gameState.winner.id === player?.name; // player.nameをIDとして使用
    
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-background-gradient)' }}>
        <Container size="lg" variant="gradient">
          <Header 
            title={`ルーム ${roomId}`}
            player={player || undefined}
            showNavigation={false}
          />
          
          <main className="text-center py-12">
            <Card variant="elevated" className="max-w-md mx-auto">
              <div className="p-8">
                <div className={`text-6xl mb-4 ${isWinner ? '🎉' : '😢'}`}>
                  {isWinner ? '🎉' : '😔'}
                </div>
                <h2 className={`text-2xl font-bold mb-4 ${isWinner ? 'text-green-600' : 'text-gray-600'}`}>
                  {isWinner ? 'おめでとうございます！' : 'ゲーム終了'}
                </h2>
                <p className="text-secondary mb-6">
                  {isWinner ? 'あなたの勝利です！' : `${gameState.winner.name}の勝利です`}
                </p>
                <div className="space-y-3">
                  <Button variant="primary" onClick={() => {}}>
                    もう一度プレイ
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

  // ゲーム中画面
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-gradient)' }}>
      <Container size="xl" variant="gradient">
        <Header 
          title={`ルーム ${roomId}`}
          player={player || undefined}
          showNavigation={false}
        >
          <div className="flex items-center gap-4">
            <div className="text-sm">
              制限時間: <span className={`font-bold ${gameState.timeLeft <= 10 ? 'text-red-300 animate-pulse' : 'text-yellow-300'}`}>
                {gameState.timeLeft}秒
              </span>
            </div>
            <Button variant="secondary" size="sm" onClick={handleLeaveGame}>
              退出
            </Button>
          </div>
        </Header>
        
        <main>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* プレイヤー情報 */}
            <div className="lg:col-span-1">
              <Card variant="elevated">
                <div className="p-4">
                  <h3 className="font-bold mb-4">プレイヤー</h3>
                  <div className="space-y-3">
                    {gameState.players.map((p, _index) => (
                      <div 
                        key={p.id} 
                        className={`flex items-center gap-3 p-2 rounded transition-all duration-200 ${
                          _index === gameState.currentPlayerIndex 
                            ? 'bg-primary-50 border border-primary-200 shadow-md transform scale-105' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          _index === gameState.currentPlayerIndex 
                            ? 'bg-primary-500 text-white animate-pulse' 
                            : 'bg-primary-100 text-primary-600'
                        }`}>
                          {p.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-sm text-secondary">手札: {p.handSize}枚</div>
                        </div>
                        {_index === gameState.currentPlayerIndex && (
                          <div className="text-xs bg-primary-500 text-white px-2 py-1 rounded animate-bounce">
                            ターン中
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* ゲームボード */}
            <div className="lg:col-span-2">
              <GameBoard
                centerCard={gameState.centerCard}
                playerHand={gameState.playerHand}
                onCardPlay={handleCardPlay}
                currentPlayer={gameState.currentPlayerIndex}
                isPlayerTurn={isPlayerTurn()}
                timeLeft={gameState.timeLeft}
              />
            </div>
          </div>

          {/* ゲーム情報 */}
          <Card variant="elevated">
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-secondary">ルームID</div>
                  <div className="font-mono text-lg">{roomId}</div>
                </div>
                <div>
                  <div className="text-sm text-secondary">プレイヤー数</div>
                  <div className="text-lg">{gameState.players.length}人</div>
                </div>
                <div>
                  <div className="text-sm text-secondary">ルール</div>
                  <div className="text-sm">±1以内 または 同数</div>
                </div>
              </div>
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
  const { roomId = '123456' } = useParams<{ roomId: string }>();
  const playerId = props.player?.name || 'guest';

  return (
    <GameProvider roomId={roomId} playerId={playerId}>
      <GamePageContent {...props} />
    </GameProvider>
  );
};

export default GamePage;