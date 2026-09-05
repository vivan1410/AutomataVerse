import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  active?: boolean;
  loading?: boolean;
  glow?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  rightIcon,
  active = false,
  loading = false,
  disabled = false,
  glow = false,
  children,
  className = '',
  ...props
}) => {
  const isIconOnly = !children && (!!icon || !!rightIcon);
  
  const classes = [
    'av-btn',
    `av-btn-${variant}`,
    `av-btn-${size}`,
    isIconOnly ? 'av-btn-icon-only' : '',
    active ? 'active' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {/* Ripple/Press Overlay */}
      <span className="av-btn-ripple" />
      
      {/* Left Loading Spinner or Icon */}
      {loading ? (
        <span className="btn-icon-left">
          <span className="btn-spinner" />
        </span>
      ) : (
        icon && <span className="btn-icon-left">{icon}</span>
      )}
      
      {children && <span>{children}</span>}
      
      {/* Right Icon (only show if not loading or if left loading is not displaying) */}
      {!loading && rightIcon && <span className="btn-icon-right">{rightIcon}</span>}
    </button>
  );
};

export default Button;
