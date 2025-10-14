import React from 'react';
import './Grid.css';

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: number | 'auto' | 'auto-fit' | 'auto-fill';
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  children: React.ReactNode;
}

export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: number | 'auto';
  start?: number;
  end?: number;
  responsive?: {
    sm?: { span?: number; start?: number; end?: number };
    md?: { span?: number; start?: number; end?: number };
    lg?: { span?: number; start?: number; end?: number };
    xl?: { span?: number; start?: number; end?: number };
  };
  children: React.ReactNode;
}

export const Grid: React.FC<GridProps> = ({
  columns = 'auto-fit',
  gap = 'md',
  responsive,
  align = 'stretch',
  justify = 'start',
  className = '',
  children,
  style,
  ...props
}) => {
  const gridClasses = [
    'grid',
    `grid--gap-${gap}`,
    `grid--align-${align}`,
    `grid--justify-${justify}`,
    className
  ].filter(Boolean).join(' ');

  // グリッドのスタイルを動的に生成
  const gridStyle: React.CSSProperties = {
    ...style,
    '--grid-columns': typeof columns === 'number' ? `repeat(${columns}, 1fr)` : `repeat(${columns}, minmax(250px, 1fr))`,
    ...(responsive && {
      '--grid-columns-sm': responsive.sm ? `repeat(${responsive.sm}, 1fr)` : undefined,
      '--grid-columns-md': responsive.md ? `repeat(${responsive.md}, 1fr)` : undefined,
      '--grid-columns-lg': responsive.lg ? `repeat(${responsive.lg}, 1fr)` : undefined,
      '--grid-columns-xl': responsive.xl ? `repeat(${responsive.xl}, 1fr)` : undefined,
    })
  } as React.CSSProperties;

  return (
    <div className={gridClasses} style={gridStyle} {...props}>
      {children}
    </div>
  );
};

export const GridItem: React.FC<GridItemProps> = ({
  span = 'auto',
  start,
  end,
  responsive,
  className = '',
  children,
  style,
  ...props
}) => {
  const itemClasses = [
    'grid-item',
    className
  ].filter(Boolean).join(' ');

  // グリッドアイテムのスタイルを動的に生成
  const itemStyle: React.CSSProperties = {
    ...style,
    gridColumn: span === 'auto' ? 'auto' : 
                start && end ? `${start} / ${end}` :
                start ? `${start} / span ${span}` :
                end ? `span ${span} / ${end}` :
                `span ${span}`,
    ...(responsive && {
      '--grid-item-sm': responsive.sm ? (
        responsive.sm.start && responsive.sm.end ? `${responsive.sm.start} / ${responsive.sm.end}` :
        responsive.sm.start ? `${responsive.sm.start} / span ${responsive.sm.span || 1}` :
        responsive.sm.end ? `span ${responsive.sm.span || 1} / ${responsive.sm.end}` :
        `span ${responsive.sm.span || 1}`
      ) : undefined,
      '--grid-item-md': responsive.md ? (
        responsive.md.start && responsive.md.end ? `${responsive.md.start} / ${responsive.md.end}` :
        responsive.md.start ? `${responsive.md.start} / span ${responsive.md.span || 1}` :
        responsive.md.end ? `span ${responsive.md.span || 1} / ${responsive.md.end}` :
        `span ${responsive.md.span || 1}`
      ) : undefined,
      '--grid-item-lg': responsive.lg ? (
        responsive.lg.start && responsive.lg.end ? `${responsive.lg.start} / ${responsive.lg.end}` :
        responsive.lg.start ? `${responsive.lg.start} / span ${responsive.lg.span || 1}` :
        responsive.lg.end ? `span ${responsive.lg.span || 1} / ${responsive.lg.end}` :
        `span ${responsive.lg.span || 1}`
      ) : undefined,
      '--grid-item-xl': responsive.xl ? (
        responsive.xl.start && responsive.xl.end ? `${responsive.xl.start} / ${responsive.xl.end}` :
        responsive.xl.start ? `${responsive.xl.start} / span ${responsive.xl.span || 1}` :
        responsive.xl.end ? `span ${responsive.xl.span || 1} / ${responsive.xl.end}` :
        `span ${responsive.xl.span || 1}`
      ) : undefined,
    })
  } as React.CSSProperties;

  return (
    <div className={itemClasses} style={itemStyle} {...props}>
      {children}
    </div>
  );
};