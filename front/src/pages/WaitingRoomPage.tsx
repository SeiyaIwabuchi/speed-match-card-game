import React, { useState, useEffect, useContext } from 'react';
import { Container, Header, Footer, Card, Button, Grid, GridItem } from '../components';
import { PlayerContext } from '../contexts';

interface WaitingRoomPageProps {
  onNavigate?: (path: string) => void;
  roomId?: string;
}

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isReady: boolean;
  isHost: boolean;
}

interface Room {
  id: string;
  name: string;
  players: number;
  maxPlayers: number;
  status: 'waiting' | 'in-progress' | 'finished';
  isPublic: boolean;
  cardCount: number;
  timeLimit: number;
  description: string;
  createdBy: string;
  createdAt: string;
  participants: Participant[];
}

const WaitingRoomPage: React.FC<WaitingRoomPageProps> = ({ onNavigate, roomId }) => {
  const { player } = useContext(PlayerContext);
  const [room, setRoom] = useState<Room | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadRoomData();
  }, [roomId]);

  const loadRoomData = () => {
    try {
      // LocalStorageからルーム情報を取得
      const currentRoom = localStorage.getItem('currentRoom');
      if (currentRoom) {
        const roomData = JSON.parse(currentRoom);
        setRoom(roomData);
        
        // 現在のプレイヤーの準備状態を確認
        const currentParticipant = roomData.participants.find((p: Participant) => p.id === player?.name);
        if (currentParticipant) {
          setIsReady(currentParticipant.isReady);
        }
      } else {
        // roomIdが指定されている場合は、保存されたルーム一覧から検索
        if (roomId) {
          const rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
          const foundRoom = rooms.find((r: Room) => r.id === roomId);
          if (foundRoom) {
            setRoom(foundRoom);
            localStorage.setItem('currentRoom', JSON.stringify(foundRoom));
          }
        }
      }
    } catch (error) {
      console.error('Failed to load room data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyRoomCode = async () => {
    if (!room) return;

    try {
      await navigator.clipboard.writeText(room.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy room code:', error);
      // フォールバック: テキストを選択状態にする
      const textArea = document.createElement('textarea');
      textArea.value = room.id;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleReady = () => {
    if (!room || !player) return;

    const newReadyStatus = !isReady;
    setIsReady(newReadyStatus);

    // ルーム情報を更新
    const updatedRoom = {
      ...room,
      participants: room.participants.map(p => 
        p.id === player.name 
          ? { ...p, isReady: newReadyStatus }
          : p
      )
    };

    setRoom(updatedRoom);
    localStorage.setItem('currentRoom', JSON.stringify(updatedRoom));

    // 全ての参加者を更新（実際の実装ではWebSocketやAPIで同期）
    updateRoomInStorage(updatedRoom);
  };

  const updateRoomInStorage = (updatedRoom: Room) => {
    try {
      const rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
      const updatedRooms = rooms.map((r: Room) => 
        r.id === updatedRoom.id ? updatedRoom : r
      );
      localStorage.setItem('rooms', JSON.stringify(updatedRooms));
    } catch (error) {
      console.error('Failed to update room in storage:', error);
    }
  };

  const handleLeaveRoom = () => {
    if (confirm('本当にルームから退出しますか？')) {
      // ルーム情報をクリア
      localStorage.removeItem('currentRoom');
      
      if (onNavigate) {
        onNavigate('rooms');
      }
    }
  };

  const handleStartGame = () => {
    if (!room) return;

    const allReady = room.participants.every(p => p.isReady || p.isHost);
    if (!allReady) {
      alert('全員の準備が完了してからゲームを開始してください。');
      return;
    }

    // ゲーム画面に遷移
    if (onNavigate) {
      onNavigate(`game/${room.id}`);
    }
  };

  const isHost = room?.participants.find(p => p.id === player?.name)?.isHost || false;
  const allReady = room?.participants.every(p => p.isReady || p.isHost) || false;

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-background-gradient)' }}>
        <Container size="xl" variant="gradient">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-white text-lg">ルーム情報を読み込み中...</div>
          </div>
        </Container>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--color-background-gradient)' }}>
        <Container size="xl" variant="gradient">
          <div className="flex items-center justify-center min-h-screen">
            <Card variant="elevated" className="p-8 text-center">
              <h2 className="text-xl font-bold mb-4">ルームが見つかりません</h2>
              <p className="text-gray-600 mb-6">指定されたルームは存在しないか、既に削除されています。</p>
              <Button
                variant="primary"
                onClick={() => onNavigate?.('rooms')}
              >
                ルーム一覧に戻る
              </Button>
            </Card>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background-gradient)' }}>
      <Container size="xl" variant="gradient">
        <Header>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">{room.name}</h1>
            {player && (
              <div className="flex items-center gap-3 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                    {player.avatar}
                  </div>
                  <span className="font-medium">{player.name}</span>
                  {isHost && (
                    <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                      ホスト
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </Header>

        <main className="flex-1 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* ルーム情報カード */}
            <Card variant="elevated" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ルームコード */}
                <div>
                  <h3 className="text-lg font-bold mb-3">ルームコード</h3>
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 font-mono text-2xl font-bold text-center">
                      {room.id}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCopyRoomCode}
                    >
                      {copied ? 'コピー済み！' : 'コピー'}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    このコードを友達に共有してルームに招待しましょう
                  </p>
                </div>

                {/* ルーム設定 */}
                <div>
                  <h3 className="text-lg font-bold mb-3">ゲーム設定</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">最大参加人数:</span>
                      <span className="font-medium">{room.maxPlayers}人</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">手札枚数:</span>
                      <span className="font-medium">{room.cardCount}枚</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">制限時間:</span>
                      <span className="font-medium">{room.timeLimit}秒</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">公開設定:</span>
                      <span className="font-medium">
                        {room.isPublic ? '公開ルーム' : 'プライベートルーム'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {room.description && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold mb-2">ルーム説明</h3>
                  <p className="text-gray-700">{room.description}</p>
                </div>
              )}
            </Card>

            {/* 参加者一覧 */}
            <Card variant="elevated" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                  参加者 ({room.participants.length}/{room.maxPlayers})
                </h3>
                <div className="text-sm text-gray-600">
                  {allReady ? '全員準備完了！' : '準備待ち...'}
                </div>
              </div>

              <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" gap="md">
                {room.participants.map((participant) => (
                  <GridItem key={participant.id}>
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                        {participant.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{participant.name}</span>
                          {participant.isHost && (
                            <span className="bg-yellow-400 text-black px-1.5 py-0.5 rounded text-xs font-bold">
                              ホスト
                            </span>
                          )}
                        </div>
                        <div className="text-sm">
                          {participant.isReady ? (
                            <span className="text-green-600 font-medium">準備完了</span>
                          ) : (
                            <span className="text-gray-500">準備中...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </GridItem>
                ))}

                {/* 空きスロット */}
                {Array.from({ length: room.maxPlayers - room.participants.length }).map((_, index) => (
                  <GridItem key={`empty-${index}`}>
                    <div className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                      <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <span className="text-gray-400 text-2xl">+</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-gray-500 text-sm">待機中...</div>
                      </div>
                    </div>
                  </GridItem>
                ))}
              </Grid>
            </Card>

            {/* アクションボタン */}
            <div className="flex gap-4">
              <Button
                variant="secondary"
                size="lg"
                onClick={handleLeaveRoom}
                className="flex-1"
              >
                ルームから退出
              </Button>

              {!isHost ? (
                <Button
                  variant={isReady ? "outline" : "primary"}
                  size="lg"
                  onClick={handleToggleReady}
                  className="flex-1"
                >
                  {isReady ? '準備解除' : '準備完了'}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleStartGame}
                  disabled={!allReady || room.participants.length < 2}
                  className="flex-1"
                >
                  {!allReady ? '準備待ち...' : 
                   room.participants.length < 2 ? '参加者が不足' : 
                   'ゲーム開始'}
                </Button>
              )}
            </div>

            {/* 注意事項 */}
            <Card variant="outline" className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">i</span>
                </div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">ゲーム開始について</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• 最低2人以上の参加者が必要です</li>
                    <li>• ホスト以外の全員が「準備完了」状態である必要があります</li>
                    <li>• ゲーム開始後は途中参加できません</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </main>

        <Footer />
      </Container>
    </div>
  );
};

export default WaitingRoomPage;