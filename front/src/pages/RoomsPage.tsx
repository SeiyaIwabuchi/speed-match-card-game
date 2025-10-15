import React, { useState, useMemo } from 'react';
import { Container, Header, Footer, Grid, GridItem, Card, Button, Input } from '../components';

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
  // フィルター・検索の状態管理
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'available' | 'public' | 'private'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'players' | 'maxPlayers'>('name');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState('');

  // フィルター・ソート済みのルーム一覧
  const filteredAndSortedRooms = useMemo(() => {
    let filtered = mockRooms.filter(room => {
      // 検索フィルター
      const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           room.id.includes(searchTerm);
      
      // カテゴリフィルター
      let matchesFilter = true;
      switch (filterBy) {
        case 'available':
          matchesFilter = room.players < room.maxPlayers;
          break;
        case 'public':
          matchesFilter = room.isPublic;
          break;
        case 'private':
          matchesFilter = !room.isPublic;
          break;
        case 'all':
        default:
          matchesFilter = true;
      }
      
      return matchesSearch && matchesFilter;
    });

    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'players':
          return b.players - a.players;
        case 'maxPlayers':
          return b.maxPlayers - a.maxPlayers;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [searchTerm, filterBy, sortBy]);

  const handleJoinRoom = (roomId: string) => {
    console.log(`Joining room: ${roomId}`);
    if (onNavigate) {
      onNavigate(`game/${roomId}`);
    }
  };

  const handleCreateRoom = () => {
    console.log('Creating new room');
    // TODO: ルーム作成処理
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // TODO: 実際のAPI呼び出し
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleJoinByCode = () => {
    if (joinRoomCode.trim()) {
      console.log(`Joining room by code: ${joinRoomCode}`);
      setShowJoinDialog(false);
      setJoinRoomCode('');
      if (onNavigate) {
        onNavigate(`game/${joinRoomCode}`);
      }
    }
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
                  variant="outline" 
                  size="lg"
                  onClick={() => setShowJoinDialog(true)}
                >
                  コードで参加
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

          {/* フィルター・検索コントロール */}
          <div className="mb-6 p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 検索ボックス */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  検索
                </label>
                <Input
                  type="text"
                  placeholder="ルーム名またはIDで検索"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* フィルター */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  フィルター
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                >
                  <option value="all">すべて</option>
                  <option value="available">参加可能</option>
                  <option value="public">公開ルーム</option>
                  <option value="private">プライベート</option>
                </select>
              </div>

              {/* ソート */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  並び順
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="name">名前順</option>
                  <option value="players">参加者数(多い順)</option>
                  <option value="maxPlayers">定員数(多い順)</option>
                </select>
              </div>

              {/* 更新ボタン */}
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="w-full"
                >
                  {isRefreshing ? '更新中...' : '更新'}
                </Button>
              </div>
            </div>

            {/* 検索結果の表示 */}
            <div className="mt-3 text-sm text-gray-600">
              {filteredAndSortedRooms.length === mockRooms.length ? (
                `全 ${mockRooms.length} 件のルーム`
              ) : (
                `${filteredAndSortedRooms.length} / ${mockRooms.length} 件のルーム`
              )}
              {searchTerm && (
                <span className="ml-2">
                  「{searchTerm}」で検索中
                </span>
              )}
            </div>
          </div>

          <Grid className="grid--rooms" gap="lg">
            {filteredAndSortedRooms.map((room) => (
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
          
          {filteredAndSortedRooms.length === 0 && (
            <div className="text-center py-12">
              {mockRooms.length === 0 ? (
                <>
                  <p className="text-lg text-secondary mb-4">現在参加可能なルームがありません</p>
                  <Button variant="primary" size="lg" onClick={handleCreateRoom}>
                    最初のルームを作成
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-lg text-secondary mb-4">
                    検索条件に一致するルームが見つかりません
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button 
                      variant="secondary" 
                      size="lg" 
                      onClick={() => {
                        setSearchTerm('');
                        setFilterBy('all');
                      }}
                    >
                      フィルターをクリア
                    </Button>
                    <Button variant="primary" size="lg" onClick={handleCreateRoom}>
                      新しいルームを作成
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </main>

        <Footer />
      </Container>

      {/* コード入力ダイアログ */}
      {showJoinDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowJoinDialog(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">ルームコードで参加</h3>
            <p className="text-gray-600 mb-4">
              友達から教えてもらったルームコードを入力してください
            </p>
            <Input
              type="text"
              placeholder="ルームコード（例: 123456）"
              value={joinRoomCode}
              onChange={(e) => setJoinRoomCode(e.target.value)}
              className="mb-4"
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowJoinDialog(false);
                  setJoinRoomCode('');
                }}
              >
                キャンセル
              </Button>
              <Button
                variant="primary"
                onClick={handleJoinByCode}
                disabled={!joinRoomCode.trim()}
              >
                参加する
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomsPage;