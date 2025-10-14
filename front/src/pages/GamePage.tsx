import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Header, Footer, Card, Button } from '../components';

interface GamePageProps {
  onNavigate?: (page: string) => void;
  player?: {
    name: string;
    avatar?: string;
    wins?: number;
    totalGames?: number;
  } | null;
}

const GamePage: React.FC<GamePageProps> = ({ 
  onNavigate, 
  player
}) => {
  const { roomId = '123456' } = useParams<{ roomId: string }>();
  const handleLeaveGame = () => {
    console.log('Leaving game');
    if (onNavigate) {
      onNavigate('rooms');
    }
  };

  // モックデータ - 実際のゲーム状態
  const gameState = {
    currentPlayer: 0,
    players: [
      { name: player?.name || 'あなた', handSize: 5, avatar: player?.avatar || 'Y' },
      { name: 'プレイヤー2', handSize: 6, avatar: 'P' },
      { name: 'プレイヤー3', handSize: 4, avatar: 'Q' },
    ],
    centerCard: { number: 7, suit: 'hearts' },
    gamePhase: 'playing' as 'waiting' | 'playing' | 'finished',
    timeLeft: 25
  };

  const renderPlayerHand = () => {
    // プレイヤーの手札をモック表示
    const cards = [
      { number: 6, suit: 'spades' },
      { number: 8, suit: 'hearts' },
      { number: 7, suit: 'clubs' },
      { number: 3, suit: 'diamonds' },
      { number: 9, suit: 'hearts' }
    ];

    return (
      <div className="flex gap-2 justify-center">
        {cards.map((card, index) => (
          <div
            key={index}
            className="w-16 h-24 bg-white border-2 border-gray-300 rounded-lg shadow-md cursor-pointer hover:scale-105 transition-transform flex flex-col items-center justify-center"
            onClick={() => console.log('Card played:', card)}
          >
            <div className="text-lg font-bold">{card.number}</div>
            <div className="text-sm">
              {card.suit === 'hearts' ? '♥️' : 
               card.suit === 'diamonds' ? '♦️' : 
               card.suit === 'clubs' ? '♣️' : '♠️'}
            </div>
          </div>
        ))}
      </div>
    );
  };

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
                    {gameState.players.map((p, index) => (
                      <div key={index} className="flex items-center gap-2 justify-center">
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
              制限時間: <span className="font-bold text-yellow-300">{gameState.timeLeft}秒</span>
            </div>
            <Button variant="secondary" size="sm" onClick={handleLeaveGame}>
              退出
            </Button>
          </div>
        </Header>
        
        <main>
          {/* ゲームエリア */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* 他のプレイヤー情報 */}
            <div className="lg:col-span-1">
              <Card variant="elevated">
                <div className="p-4">
                  <h3 className="font-bold mb-4">プレイヤー</h3>
                  <div className="space-y-3">
                    {gameState.players.map((p, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center gap-3 p-2 rounded ${
                          index === gameState.currentPlayer ? 'bg-primary-50 border border-primary-200' : ''
                        }`}
                      >
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                          {p.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-sm text-secondary">手札: {p.handSize}枚</div>
                        </div>
                        {index === gameState.currentPlayer && (
                          <div className="text-xs bg-primary-500 text-white px-2 py-1 rounded">
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
            <div className="lg:col-span-1">
              <Card variant="elevated">
                <div className="p-6 text-center">
                  <h3 className="font-bold mb-4">場のカード</h3>
                  <div className="w-20 h-32 bg-white border-2 border-gray-300 rounded-lg shadow-lg mx-auto flex flex-col items-center justify-center mb-4">
                    <div className="text-2xl font-bold">{gameState.centerCard.number}</div>
                    <div className="text-lg">
                      {gameState.centerCard.suit === 'hearts' ? '♥️' : 
                       gameState.centerCard.suit === 'diamonds' ? '♦️' : 
                       gameState.centerCard.suit === 'clubs' ? '♣️' : '♠️'}
                    </div>
                  </div>
                  <p className="text-sm text-secondary">
                    ±1以内の数字または同じ数字を出せます
                  </p>
                </div>
              </Card>
            </div>

            {/* ゲーム情報 */}
            <div className="lg:col-span-1">
              <Card variant="elevated">
                <div className="p-4">
                  <h3 className="font-bold mb-4">ゲーム情報</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-secondary">ルームID</div>
                      <div className="font-mono">{roomId}</div>
                    </div>
                    <div>
                      <div className="text-sm text-secondary">プレイヤー数</div>
                      <div>{gameState.players.length}人</div>
                    </div>
                    <div>
                      <div className="text-sm text-secondary">ルール</div>
                      <div className="text-sm">±1以内 または 同数</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* プレイヤーの手札 */}
          <Card variant="elevated">
            <div className="p-6">
              <h3 className="font-bold mb-4 text-center">あなたの手札</h3>
              {renderPlayerHand()}
              <div className="text-center mt-4">
                <p className="text-sm text-secondary">
                  カードをクリックしてプレイ
                </p>
              </div>
            </div>
          </Card>
        </main>

        <Footer />
      </Container>
    </div>
  );
};

export default GamePage;