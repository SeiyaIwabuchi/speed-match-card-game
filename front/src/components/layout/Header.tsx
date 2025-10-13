import React from 'react';
import './Header.css';

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'スピードマッチ',
  className = '',
  children,
  ...props
}) => {
  const allClasses = `header ${className}`.trim();

  return (
    <header className={allClasses} {...props}>
      <div className="header__title">
        {title}
      </div>
      {children && (
        <div className="header__content">
          {children}
        </div>
      )}
    </header>
  );
};