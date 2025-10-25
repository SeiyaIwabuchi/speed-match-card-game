import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { PlayerProvider, usePlayer, RoomProvider } from './contexts';
import { HomePage, RoomsPage, ProfilePage, GamePage, PlayerRegistrationPage, CreateRoomPage, WaitingRoomPage, ResultPage } from './pages';
import './App.css';

// WaitingRoomPageのラッパーコンポーネント
const WaitingRoomPageWrapper: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { roomCode } = useParams<{ roomCode: string }>();
  return <WaitingRoomPage onNavigate={onNavigate} roomCode={roomCode} />;
};

// ナビゲーション機能を持つルーターコンポーネント
const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { player, updatePlayer, isRegistered } = usePlayer();

  // 未登録ユーザーを登録画面にリダイレクト
  useEffect(() => {
    if (!isRegistered && location.pathname !== '/register') {
      navigate('/register');
    }
  }, [isRegistered, location.pathname, navigate]);

  const handleNavigate = (page: string) => {
    switch (page) {
      case 'home':
        navigate('/');
        break;
      case 'rooms':
        navigate('/rooms');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'register':
        navigate('/register');
        break;
      case 'create-room':
        navigate('/create-room');
        break;
      default:
        if (page.startsWith('game/')) {
          const roomId = page.split('/')[1];
          navigate(`/game/${roomId}`);
        } else if (page.startsWith('waiting-room/')) {
          const roomId = page.split('/')[1];
          navigate(`/waiting-room/${roomId}`);
        } else if (page.startsWith('result/')) {
          const gameId = page.split('/')[1];
          navigate(`/result/${gameId}`);
        }
        break;
    }
  };

  const handleRegistrationComplete = () => {
    navigate('/?registered=true');
  };

  return (
    <Routes>
      <Route 
        path="/register" 
        element={
          <PlayerRegistrationPage 
            onNavigate={handleNavigate}
            onRegistrationComplete={handleRegistrationComplete}
          />
        } 
      />
      <Route 
        path="/" 
        element={
          <HomePage 
            onNavigate={handleNavigate}
            player={player}
          />
        } 
      />
      <Route 
        path="/rooms" 
        element={
          <RoomsPage 
            onNavigate={handleNavigate}
            player={player}
          />
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProfilePage 
            onNavigate={handleNavigate}
            player={player}
            onPlayerUpdate={updatePlayer}
          />
        } 
      />
      <Route 
        path="/create-room" 
        element={
          <CreateRoomPage 
            onNavigate={handleNavigate}
          />
        } 
      />
      <Route 
        path="/waiting-room/:roomCode" 
        element={
          <WaitingRoomPageWrapper 
            onNavigate={handleNavigate}
          />
        } 
      />
      <Route 
        path="/game/:gameId" 
        element={
          <GamePage 
            onNavigate={handleNavigate}
          />
        } 
      />
      <Route 
        path="/result/:gameId" 
        element={
          <ResultPage 
            onNavigate={handleNavigate}
          />
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <PlayerProvider>
      <RoomProvider>
        <Router>
          <AppRoutes />
        </Router>
      </RoomProvider>
    </PlayerProvider>
  );
}

export default App;
