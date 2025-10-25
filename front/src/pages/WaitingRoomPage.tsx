import React, { useState, useEffect, useContext } from 'react';
import { Container, Header, Footer, Card, Button, Grid, GridItem, ChatBox } from '../components';
import { PlayerContext } from '../contexts';
import { useApiError } from '../hooks/useApiError';
import { getRoom, getRoomByCode, leaveRoom, setReady, sendChatMessage, getChatMessages, startGame } from '../api/room';
import { createGame, getGameState } from '../api/game';
import type { ChatMessage } from '../api/chat';

interface WaitingRoomPageProps {
  onNavigate?: (path: string) => void;
  roomCode?: string;
}

interface Participant {
  playerId: string;
  username: string;
  avatar: string;
  isReady: boolean;
  isHost: boolean;
}

interface Room {
  roomId: string;
  roomCode: string;
  roomName: string | null;
  hostId: string;
  maxPlayers: number;
  currentPlayers: number;
  initialHandSize: number;
  turnTimeLimit: number;
  isPublic: boolean;
  status: string;
  players: Participant[];
  createdAt: string;
  gameId?: string; // ゲーム開始後に追加される
}

const WaitingRoomPage: React.FC<WaitingRoomPageProps> = ({ onNavigate, roomCode }) => {
  const { player } = useContext(PlayerContext) || {};
  const { handleApiCall } = useApiError();
  const [room, setRoom] = useState<Room | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  
  // チャット機能
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatPollingInterval, setChatPollingInterval] = useState<number | null>(null);

  // チャットメッセージを読み込む
  const loadChatMessages = async () => {
    if (!room) return;

    try {
      const response = await getChatMessages(room.roomId, 50);
      // ChatMessageResponse から ChatMessage に変換
      const messages: ChatMessage[] = response.messages.map(msg => ({
        id: msg.messageId,
        roomId: msg.roomId,
        playerId: msg.playerId,
        playerName: msg.username,
        playerAvatar: msg.avatar,
        message: msg.message,
        createdAt: msg.createdAt
      }));
      setChatMessages(messages);
      setChatError(null);
    } catch (error) {
      console.error('Failed to load chat messages:', error);
      setChatError('メッセージの読み込みに失敗しました');
    }
  };

  // チャットメッセージのポーリング
  useEffect(() => {
    if (room) {
      loadChatMessages();
      
      // 3秒ごとにチャットメッセージを取得
      const interval = setInterval(() => {
        loadChatMessages();
      }, 3000);
      setChatPollingInterval(interval);
    }

    return () => {
      if (chatPollingInterval) {
        console.log('Cleaning up chat polling interval');
        clearInterval(chatPollingInterval);
        setChatPollingInterval(null);
      }
    };
  }, [room]);

  useEffect(() => {
    if (roomCode) {
      loadRoomData();
      // ルーム情報を定期的に更新（ポーリング）
      const interval = setInterval(() => {
        loadRoomData();
      }, 3000); // 3秒ごとに更新
      setPollingInterval(interval);
    }

    return () => {
      if (pollingInterval) {
        console.log('Cleaning up room polling interval');
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    };
  }, [roomCode]);

  const loadRoomData = async () => {
    if (!roomCode || !player) return;

    try {
      // まずroomCodeからroomIdを取得
      const roomCodeResponse = await getRoomByCode(roomCode);
      const roomId = roomCodeResponse.roomId;
      
      // roomIdで詳細情報を取得
      const roomData = await getRoom(roomId);
      setRoom(roomData);
      
      // 現在のプレイヤーの準備状態を確認
      const currentParticipant = roomData.players.find((p: Participant) => p.playerId === player.name);
      if (currentParticipant) {
        setIsReady(currentParticipant.isReady);
      }

      // ゲームが開始されたら全員がゲーム画面に遷移
      if (roomData.status === 'playing' || roomData.status === 'started' || roomData.gameId) {
        console.log('Game has started, navigating to game screen. Status:', roomData.status, 'GameId:', roomData.gameId);
        
        // ポーリングを停止
        if (pollingInterval) {
          console.log('Stopping room polling interval');
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        if (chatPollingInterval) {
          console.log('Stopping chat polling interval');
          clearInterval(chatPollingInterval);
          setChatPollingInterval(null);
        }
        
        if (onNavigate) {
          // gameIdがルーム情報に含まれている場合
          if (roomData.gameId) {
            console.log('Navigating to game with gameId:', roomData.gameId);
            onNavigate(`game/${roomData.gameId}`);
          } else {
            // フォールバック: ゲーム状態から取得
            try {
              console.log('Fallback: getting game state for roomId:', roomId);
              const gameState = await getGameState(roomId, player.id);
              console.log('Got game state:', gameState);
              onNavigate(`game/${gameState.gameId}`);
            } catch (error) {
              console.error('Failed to get game state:', error);
              alert("ゲーム状態の取得に失敗しました。");
            }
          }
        }
        return; // 早期リターンで以降の処理をスキップ
      }
    } catch (error) {
      console.error('Failed to load room data:', error);
      // エラー時はモックデータを使用（初回のみ）
      if (!useMockData) {
        const mockRoom: Room = {
          roomId: 'mock-room-id',
          roomCode: roomCode,
          roomName: 'TestRoom',
          hostId: player.name,
          maxPlayers: 4,
          currentPlayers: 1,
          initialHandSize: 7,
          turnTimeLimit: 30,
          isPublic: true,
          status: 'waiting',
          players: [{
            playerId: player.name,
            username: player.name,
            avatar: player.avatar || '?',
            isReady: false,
            isHost: true
          }],
          createdAt: new Date().toISOString()
        };
        setRoom(mockRoom);
        setUseMockData(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyRoomCode = async () => {
    if (!room) return;

    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy room code:', error);
      // フォールバック: テキストを選択状態にする
      const textArea = document.createElement('textarea');
      textArea.value = room.roomCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleReady = async () => {
    if (!room || !player) return;

    const newReadyStatus = !isReady;
    setIsReady(newReadyStatus);

    try {
      await handleApiCall(
        () => setReady(room.roomId, { playerId: player.id, isReady: newReadyStatus }),
        (result) => {
          console.log('Ready status updated:', result);
          // ルーム情報を再取得して同期
          loadRoomData();
        },
        (error) => {
          console.error('Failed to update ready status:', error);
          // エラーの場合は状態を元に戻す
          setIsReady(!newReadyStatus);
        }
      );
    } catch (error) {
      console.error('Failed to update ready status:', error);
      setIsReady(!newReadyStatus);
    }
  };

  const handleLeaveRoom = async () => {
    if (!room || !player) return;

    if (confirm('本当にルームから退出しますか？')) {
      try {
        await handleApiCall(
          () => leaveRoom(room.roomId, { playerId: player.name }),
          (result) => {
            console.log('Left room:', result);
            if (onNavigate) {
              onNavigate('rooms');
            }
          },
          (error) => {
            console.error('Failed to leave room:', error);
            alert(`ルームからの退出に失敗しました: ${error.message}`);
          }
        );
      } catch (error) {
        console.error('Failed to leave room:', error);
      }
    }
  };

  const handleStartGame = async () => {
    if (!room || !player) return;

    const allReady = room.players.every(p => p.isReady || p.isHost);
    if (!allReady) {
      alert('全員の準備が完了してからゲームを開始してください。');
      return;
    }

    try {
      // まずゲームを作成
      const playerIds = room.players.map(p => p.playerId);
      await handleApiCall(
        () => createGame({ roomId: room.roomId, playerIds }),
        (createResult) => {
          console.log('Game created:', createResult);
          
          // 次にルームを開始状態に変更
          handleApiCall(
            () => startGame(room.roomId, { hostId: player.id! }),
            (startResult) => {
              console.log('Room started:', startResult);
              // ホストもポーリングでステータス変更を待つ（全員が同じタイミングで遷移するため）
              // 遷移はloadRoomDataのポーリングで検知される
            },
            (startError) => {
              console.error('Failed to start room:', startError);
              alert(`ルームの開始に失敗しました: ${startError.message}`);
            }
          );
        },
        (createError) => {
          console.error('Failed to create game:', createError);
          alert(`ゲームの作成に失敗しました: ${createError.message}`);
        }
      );
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  // チャットメッセージ送信
  const handleSendMessage = async (message: string): Promise<void> => {
    if (!player || !room || !player.id) return;

    try {
      await sendChatMessage(room.roomId, {
        playerId: player.id,
        message,
        type: 'text'
      });

      // 送信後すぐにメッセージを再取得
      await loadChatMessages();
      setChatError(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      setChatError('メッセージの送信に失敗しました');
    }
  };

  const isHost = room?.players.find(p => p.playerId === player?.id)?.isHost || false;
  const allReady = room?.players.every(p => p.isReady || p.isHost) || false;

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
            <h1 className="text-2xl font-bold text-white">{room.roomName || 'ルーム'}</h1>
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
                      {room.roomCode}
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
                      <span className="font-medium">{room.initialHandSize}枚</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">制限時間:</span>
                      <span className="font-medium">{room.turnTimeLimit}秒</span>
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
            </Card>

            {/* 参加者一覧 */}
            <Card variant="elevated" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                  参加者 ({room.players.length}/{room.maxPlayers})
                </h3>
                <div className="text-sm text-gray-600">
                  {allReady ? '全員準備完了！' : '準備待ち...'}
                </div>
              </div>

              <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" gap="md">
                {room.players.map((participant) => (
                  <GridItem key={participant.playerId}>
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                        {participant.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{participant.username}</span>
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
                {Array.from({ length: room.maxPlayers - room.players.length }).map((_, index) => (
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

            {/* チャット */}
            <Card variant="elevated" className="p-6">
              <h3 className="text-lg font-bold mb-4">チャット</h3>
              <ChatBox
                messages={chatMessages}
                currentPlayerId={player?.name || ''}
                onSendMessage={handleSendMessage}
                error={chatError}
                maxHeight="300px"
              />
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
                  disabled={!allReady || room.players.length < 2}
                  className="flex-1"
                >
                  {!allReady ? '準備待ち...' : 
                   room.players.length < 2 ? '参加者が不足' : 
                   'ゲーム開始'}
                </Button>
              )}
            </div>

            {/* 注意事項 */}
            <Card variant="outlined" className="p-4 bg-blue-50 border-blue-200">
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