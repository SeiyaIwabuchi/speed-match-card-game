import React from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { PlayerProvider, usePlayer } from './contexts';
import { HomePage, RoomsPage, ProfilePage, GamePage } from './pages';
import './App.css';

// ナビゲーション機能を持つルーターコンポーネント
const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  const { player, updatePlayer } = usePlayer();

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
      default:
        if (page.startsWith('game/')) {
          const roomId = page.split('/')[1];
          navigate(`/game/${roomId}`);
        }
        break;
    }
  };

  return (
    <Routes>
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
