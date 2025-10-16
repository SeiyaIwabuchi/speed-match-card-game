import React, { useState } from 'react';

export interface GameCardProps {
  number: number;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  playable?: boolean;
  selected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const GameCard: React.FC<GameCardProps> = ({
  number,
  suit,
  playable = true,
  selected = false,
  onClick,
  onDoubleClick,
  size = 'md',
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const getSuitSymbol = (suit: string): string => {
    switch (suit) {
      case 'hearts': return '♥️';
      case 'diamonds': return '♦️';
      case 'clubs': return '♣️';
      case 'spades': return '♠️';
      default: return '?';
    }
  };

  const getSuitColor = (suit: string): string => {
    return (suit === 'hearts' || suit === 'diamonds') ? 'text-red-500' : 'text-gray-800';
  };

  const getSizeClasses = (size: string): string => {
    switch (size) {
      case 'sm': return 'w-12 h-18 text-sm';
      case 'md': return 'w-16 h-24 text-lg';
      case 'lg': return 'w-20 h-32 text-2xl';
      default: return 'w-16 h-24 text-lg';
    }
  };

  const handleClick = () => {
    if (!playable) return;
    
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 150);
    
    if (onClick) {
      onClick();
    }
  };

  const handleDoubleClick = () => {
    if (!playable || !onDoubleClick) return;
    onDoubleClick();
  };

  const baseClasses = `
    ${getSizeClasses(size)}
    bg-white 
    border-2 
    rounded-lg 
    shadow-md 
    flex 
    flex-col 
    items-center 
    justify-center 
    font-bold
    game-card-transition
    ${playable ? 'cursor-pointer game-card-hover' : 'cursor-not-allowed opacity-50'}
    ${className}
  `;

  const hoverClasses = playable && isHovered ? `
    transform 
    scale-110 
    -translate-y-2 
    shadow-xl 
    border-blue-400
    bg-blue-50
  ` : '';

  const selectedClasses = selected ? `
    border-blue-500 
    bg-blue-100 
    transform 
    scale-105
  ` : playable ? 'border-gray-300 hover:border-blue-300' : 'border-gray-200';

  const clickClasses = isClicked ? `
    transform 
    scale-95
  ` : '';

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${selectedClasses} ${clickClasses}`.trim()}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transformOrigin: 'center bottom'
      }}
    >
      <div className={`font-bold ${getSuitColor(suit)}`}>
        {number}
      </div>
      <div className={`${getSuitColor(suit)}`}>
        {getSuitSymbol(suit)}
      </div>
      
      {/* プレイ可能インジケーター */}
      {playable && isHovered && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
      )}
      
      {/* 選択インジケーター */}
      {selected && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
      )}
    </div>
  );
};

export default GameCard;