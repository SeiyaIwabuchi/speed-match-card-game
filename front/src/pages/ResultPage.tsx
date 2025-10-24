import React, { useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { GameProvider, useGame } from '../contexts/GameContext';
import { PlayerContext } from '../contexts/PlayerContext';
import { Container } from '../components/layout';
import { Button, ErrorMessage } from '../components/ui';
import './ResultPage.css';

interface ResultPageProps {
  onNavigate: (page: string) => void;
}

const ResultPageContent: React.FC<ResultPageProps> = ({ onNavigate }) => {
  const { gameResult, gameState, loading, error, fetchGameResult } = useGame();

  useEffect(() => {
    // ゲーム結果が未取得の場合は取得
    if (!gameResult && gameState.gameId && gameState.status === 'FINISHED') {
      fetchGameResult().catch(console.error);
    }
  }, [gameState.gameId, gameState.status]);

  const handlePlayAgain = () => {
    // 待機画面に戻る（ルームからゲームを再作成）
    if (gameState.roomId) {
      onNavigate(`waiting/${gameState.roomId}`);
    }
  };

  const handleBackToLobby = () => {
    onNavigate('rooms');
  };

  const formatPlayTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}分${secs}秒`;
  };

  const getMedalIcon = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${rank}位`;
    }
  };

  if (loading) {
    return (
      <Container className="result-page">
        <div className="result-loading">
          <p>結果を取得中...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="result-page">
        <ErrorMessage error={error} />
        <div className="result-actions">
          <Button onClick={() => fetchGameResult()}>再試行</Button>
          <Button variant="secondary" onClick={handleBackToLobby}>
            ロビーに戻る
          </Button>
        </div>
      </Container>
    );
  }

  if (!gameResult) {
    return (
      <Container className="result-page">
        <p>ゲーム結果がありません</p>
        <Button onClick={handleBackToLobby}>ロビーに戻る</Button>
      </Container>
    );
  }

  return (
    <Container className="result-page">
      <div className="result-header">
        <h1 className="result-title">ゲーム終了</h1>
        <div className="result-summary">
          <p className="result-summary-item">
            <span className="result-summary-label">プレイ時間:</span>
            <span className="result-summary-value">{formatPlayTime(gameResult.playTimeSeconds)}</span>
          </p>
          <p className="result-summary-item">
            <span className="result-summary-label">総ターン数:</span>
            <span className="result-summary-value">{gameResult.totalTurns}</span>
          </p>
        </div>
      </div>

      <div className="result-ranking">
        <h2 className="result-ranking-title">ランキング</h2>
        <div className="result-ranking-list">
          {gameResult.ranking.map((player) => (
            <div key={player.playerId} className={`result-ranking-item rank-${player.rank}`}>
              <div className="result-ranking-medal">
                {getMedalIcon(player.rank)}
              </div>
              <div className="result-ranking-player">
                <span className="result-ranking-username">{player.username}</span>
              </div>
              <div className="result-ranking-stats">
                <div className="result-stat">
                  <span className="result-stat-label">残り手札</span>
                  <span className="result-stat-value">{player.remainingCards}枚</span>
                </div>
                <div className="result-stat">
                  <span className="result-stat-label">プレイ枚数</span>
                  <span className="result-stat-value">{player.cardsPlayed}枚</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="result-actions">
        <Button onClick={handlePlayAgain} variant="primary">
          もう一度遊ぶ
        </Button>
        <Button onClick={handleBackToLobby} variant="secondary">
          ロビーに戻る
        </Button>
      </div>
    </Container>
  );
};

// ResultPageのラッパーコンポーネント（GameProviderでラップ）
export const ResultPage: React.FC<ResultPageProps> = (props) => {
  const { gameId } = useParams<{ gameId: string }>();
  const { player } = useContext(PlayerContext) || {};

  if (!gameId) {
    return (
      <Container className="result-page">
        <p>ゲームIDが指定されていません</p>
        <Button onClick={() => props.onNavigate('rooms')}>ロビーに戻る</Button>
      </Container>
    );
  }

  if (!player?.id) {
    return (
      <Container className="result-page">
        <p>プレイヤー情報が取得できません</p>
        <Button onClick={() => props.onNavigate('rooms')}>ロビーに戻る</Button>
      </Container>
    );
  }

  return (
    <GameProvider gameId={gameId} playerId={player.id}>
      <ResultPageContent {...props} />
    </GameProvider>
  );
};
