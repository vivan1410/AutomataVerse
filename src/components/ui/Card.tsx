import React from 'react';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  interactive?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  glass = false,
  interactive = false,
  glow = false,
  padding = 'md',
  children,
  className = '',
  style,
  ...props
}) => {
  const classes = [
    'av-card',
    glass ? 'av-card-glass' : '',
    interactive ? 'av-card-interactive' : '',
    glow ? 'av-card-glow' : '',
    padding !== 'md' ? `padding-${padding}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Overriding padding if custom spacing is requested
  const customStyle: React.CSSProperties = {
    ...style,
    ...(padding === 'none' && { padding: 0 }),
    ...(padding === 'sm' && { padding: 'var(--space-sm)' }),
    ...(padding === 'lg' && { padding: 'var(--space-lg)' }),
  };

  return (
    <div className={classes} style={customStyle} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`av-card-header ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`av-card-body ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`av-card-footer ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
