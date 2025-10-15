import React from 'react';
import './Container.css';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'glass' | 'gradient';
  children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({
  size = 'lg',
  variant = 'default',
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'container';
  const sizeClasses = `container--${size}`;
  const variantClasses = `container--${variant}`;

  const allClasses = [
    baseClasses,
    sizeClasses,
    variantClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={allClasses} {...props}>
      {children}
    </div>
  );
};