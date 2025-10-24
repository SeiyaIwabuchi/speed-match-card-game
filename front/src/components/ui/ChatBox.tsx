import React, { useState, useEffect, useRef } from 'react';
import { Button, Input } from './';
import type { ChatMessage } from '../../api/chat';
import './ChatBox.css';

export interface ChatBoxProps {
  messages: ChatMessage[];
  currentPlayerId: string;
  onSendMessage: (message: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  maxHeight?: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  currentPlayerId,
  onSendMessage,
  isLoading = false,
  error = null,
  maxHeight = '400px'
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // メッセージ送信処理
  const handleSend = async () => {
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage || sending) return;

    setSending(true);
    try {
      await onSendMessage(trimmedMessage);
      setInputMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  // Enter キーで送信
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 時刻をフォーマット
  const formatTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="chat-box">
      {/* メッセージ一覧 */}
      <div 
        className="chat-box__messages"
        ref={messagesContainerRef}
        style={{ maxHeight }}
      >
        {messages.length === 0 ? (
          <div className="chat-box__empty">
            <p className="chat-box__empty-text">まだメッセージがありません</p>
            <p className="chat-box__empty-hint">最初のメッセージを送信してみましょう！</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.playerId === currentPlayerId;
            
            return (
              <div
                key={msg.id}
                className={`chat-box__message ${
                  isOwnMessage ? 'chat-box__message--own' : 'chat-box__message--other'
                }`}
              >
                {!isOwnMessage && (
                  <div className="chat-box__message-avatar">
                    {msg.playerAvatar || msg.playerName.charAt(0)}
                  </div>
                )}
                
                <div className="chat-box__message-content">
                  {!isOwnMessage && (
                    <div className="chat-box__message-sender">{msg.playerName}</div>
                  )}
                  <div className={`chat-box__message-bubble ${
                    isOwnMessage ? 'chat-box__message-bubble--own' : 'chat-box__message-bubble--other'
                  }`}>
                    <p className="chat-box__message-text">{msg.message}</p>
                    <span className="chat-box__message-time">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="chat-box__error">
          <span className="chat-box__error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* 入力フォーム */}
      <div className="chat-box__input-container">
        <Input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="メッセージを入力..."
          disabled={sending || isLoading}
          className="chat-box__input"
          maxLength={500}
        />
        <Button
          onClick={handleSend}
          disabled={!inputMessage.trim() || sending || isLoading}
          loading={sending}
          variant="primary"
          size="md"
          className="chat-box__send-button"
        >
          送信
        </Button>
      </div>

      {/* メッセージカウンター */}
      <div className="chat-box__counter">
        {inputMessage.length} / 500
      </div>
    </div>
  );
};

export default ChatBox;
