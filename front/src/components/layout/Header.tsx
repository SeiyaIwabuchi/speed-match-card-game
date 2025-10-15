import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

export interface PlayerInfo {
  name: string;
  avatar?: string;
  wins?: number;
  totalGames?: number;
}

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  player?: PlayerInfo;
  showNavigation?: boolean;
  onNavigate?: (page: string) => void;
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'スピードマッチ',
  player,
  showNavigation = false,
  onNavigate,
  className = '',
  children,
  ...props
}) => {
  const allClasses = `header ${className}`.trim();



  return (
    <header className={allClasses} {...props}>
      <div className="header__left">
        <div className="header__title">
          {title}
        </div>
        {showNavigation && (
          <nav className="header__nav">
            <Link to="/" className="header__nav-button">
              ホーム
            </Link>
            <Link to="/rooms" className="header__nav-button">
              ルーム一覧
            </Link>
            <Link to="/profile" className="header__nav-button">
              プロフィール
            </Link>
          </nav>
        )}
      </div>
      
      <div className="header__right">
        {player && (
          <div className="header__user">
            <div className="header__avatar">
              {player.avatar || player.name.charAt(0).toUpperCase()}
            </div>
            <div className="header__user-info">
              <div className="header__user-name">{player.name}</div>
              {player.totalGames !== undefined && (
                <div className="header__user-stats">
                  {player.wins || 0}勝 / {player.totalGames}戦
                </div>
              )}
            </div>
          </div>
        )}
        {children && (
          <div className="header__content">
            {children}
          </div>
        )}
      </div>
    </header>
  );
};