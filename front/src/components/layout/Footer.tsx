import React from 'react';
import './Footer.css';

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export const Footer: React.FC<FooterProps> = ({
  className = '',
  children,
  ...props
}) => {
  const allClasses = `footer ${className}`.trim();

  return (
    <footer className={allClasses} {...props}>
      <div className="footer__links">
        <a href="#" className="footer__link">ヘルプ</a>
        <a href="#" className="footer__link">利用規約</a>
        <a href="#" className="footer__link">プライバシーポリシー</a>
      </div>
      {children && (
        <div className="footer__content">
          {children}
        </div>
      )}
      <div className="footer__copyright">
        © 2024 SpeedMatch. All rights reserved.
      </div>
    </footer>
  );
};