import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { PlayerProvider, usePlayer } from './contexts';
import { HomePage, RoomsPage, ProfilePage, GamePage, PlayerRegistrationPage } from './pages';
import './App.css';

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
      default:
        if (page.startsWith('game/')) {
          const roomId = page.split('/')[1];
          navigate(`/game/${roomId}`);
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
        path="/game/:roomId" 
        element={
          <GamePage 
            onNavigate={handleNavigate}
            player={player}
          />
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <PlayerProvider>
      <Router>
        <AppRoutes />
      </Router>
    </PlayerProvider>
  );
}

export default App;
