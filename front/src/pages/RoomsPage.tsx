import React from 'react';
import { Container, Header, Footer, Grid, GridItem, Card, Button } from '../components';

// モックデータ
const mockRooms = [
  {
    id: '123456',
    name: 'カジュアルルーム',
    players: 2,
    maxPlayers: 4,
    isPublic: true,
    gameSettings: {
      handSize: 7,
      timeLimit: 30
    }
  },
  {
    id: '789012',
    name: 'スピード戦',
    players: 3,
    maxPlayers: 4,
    isPublic: true,
    gameSettings: {
      handSize: 5,
      timeLimit: 15
    }
  },
  {
    id: '345678',
    name: 'プライベート',
    players: 1,
    maxPlayers: 2,
    isPublic: false,
    gameSettings: {
      handSize: 10,
      timeLimit: 60
    }
  }
];

interface RoomsPageProps {
  onNavigate?: (page: string) => void;
  player?: {
    name: string;
    avatar?: string;
    wins?: number;
    totalGames?: number;
  } | null;
}

const RoomsPage: React.FC<RoomsPageProps> = ({ onNavigate, player }) => {
  const handleJoinRoom = (roomId: string) => {
    console.log(`Joining room: ${roomId}`);
    // TODO: ルーム参加処理
    if (onNavigate) {
      onNavigate(`game/${roomId}`);
    }
  };

  const handleCreateRoom = () => {
    console.log('Creating new room');
    // TODO: ルーム作成処理
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-gradient)' }}>
      <Container size="xl" variant="gradient">
        <Header 
          title="ルーム一覧"
          player={player || undefined}
          showNavigation={true}
          onNavigate={onNavigate}
        />
        
        <main>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="h1">ゲームルーム</h1>
              <div className="flex gap-4">
                <Button 
                  variant="primary" 
                  size="lg"
                  onClick={handleCreateRoom}
                >
                  新しいルームを作成
                </Button>
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={() => onNavigate?.('home')}
                >
                  ホームに戻る
                </Button>
              </div>
            </div>
            
            <p className="text-lg text-secondary mb-8">
              参加したいルームを選択するか、新しいルームを作成してください
            </p>
          </div>

          <Grid className="grid--rooms" gap="lg">
            {mockRooms.map((room) => (
              <GridItem key={room.id}>
                <Card variant="elevated" className="h-full">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{room.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-secondary mb-2">
                          <span>ルームID: {room.id}</span>
                          {!room.isPublic && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                              プライベート
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {room.players}/{room.maxPlayers}
                        </div>
                        <div className="text-sm text-secondary">プレイヤー</div>
                      </div>
                    </div>
                    
                    <div className="mb-4 p-3 bg-background-secondary rounded-lg">
                      <h4 className="font-medium mb-2">ゲーム設定</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>手札: {room.gameSettings.handSize}枚</div>
                        <div>制限時間: {room.gameSettings.timeLimit}秒</div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="primary"
                      size="md" 
                      className="w-full"
                      disabled={room.players >= room.maxPlayers}
                      onClick={() => handleJoinRoom(room.id)}
                    >
                      {room.players >= room.maxPlayers ? '満員' : '参加する'}
                    </Button>
                  </div>
                </Card>
              </GridItem>
            ))}
          </Grid>
          
          {mockRooms.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-secondary mb-4">現在参加可能なルームがありません</p>
              <Button variant="primary" size="lg" onClick={handleCreateRoom}>
                最初のルームを作成
              </Button>
            </div>
          )}
        </main>

        <Footer />
      </Container>
    </div>
  );
};

export default RoomsPage;