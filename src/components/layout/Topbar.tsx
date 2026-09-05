import React, { useState } from 'react';
import './Topbar.css';
import {
  SearchIcon,
} from '../ui/Icon';
import { getModKey } from '../../utils/platform';

export const EPSILON_CHAR = 'ε';

export function copyEpsilonToClipboard(): Promise<boolean> {
  const char = 'ε';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(char).then(() => true).catch(() => fallbackCopy(char));
  } else {
    return Promise.resolve(fallbackCopy(char));
  }
}

function fallbackCopy(text: string): boolean {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    return false;
  }
}

interface UserProfile {
  xp: number;
  coins: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  username?: string;
  email?: string;
  avatar?: string;
}

interface TopbarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  openCommandPalette: () => void;
  profile: UserProfile;
  backendStatus: 'checking' | 'connected' | 'error';
  onTabChange?: (tab: any) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  sidebarOpen,
  toggleSidebar,
  theme: _theme,
  toggleTheme: _toggleTheme,
  openCommandPalette,
  profile,
  backendStatus: _backendStatus,
  onTabChange,
}) => {
  const [copiedEpsilon, setCopiedEpsilon] = useState(false);

  const handleCopyEpsilon = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyEpsilonToClipboard().then(() => {
      setCopiedEpsilon(true);
      setTimeout(() => {
        setCopiedEpsilon(false);
      }, 1500);
    });
  };

  return (
    <header className="av-topbar">
      {/* Left: Sidebar Toggle, App Logo & Brand Name */}
      <div className="topbar-left">
        <button
          className="topbar-toggle-btn"
          onClick={toggleSidebar}
          title={sidebarOpen ? `Collapse Left Sidebar (${getModKey()}B)` : `Expand Left Sidebar (${getModKey()}B)`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`toggle-svg-icon ${sidebarOpen ? 'expanded' : 'collapsed'}`}
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
            <g className="arrow-group">
              <path d="m16 15-3-3 3-3" />
            </g>
          </svg>
        </button>
        
        {/* Brand Logo & Name */}
        <div className="topbar-brand">
          <div className="brand-logo-mark">⚡</div>
          <span className="brand-wordmark">AutomataVerse</span>
        </div>
      </div>

      {/* Center: Premium Spotlight/Spot-search Field & Epsilon Quick-Copy Option */}
      <div className="topbar-center">
        <div className="premium-search-field" onClick={openCommandPalette}>
          <div className="search-field-left">
            <SearchIcon size={14} className="search-field-icon" />
            <span className="search-field-placeholder">Search AutomataVerse...</span>
          </div>
          <div className="search-field-shortcut">
            <span className="shortcut-badge-char">{getModKey()}</span>
            <span className="shortcut-badge-char">K</span>
          </div>
        </div>

        <button 
          className={`topbar-epsilon-btn ${copiedEpsilon ? 'copied' : ''}`}
          onClick={handleCopyEpsilon}
          title="Click to copy ε (epsilon) character to clipboard"
          aria-label="Copy epsilon character"
        >
          <span className="epsilon-symbol">ε</span>
          <span className="epsilon-text">{copiedEpsilon ? 'ε copied!' : 'Copy ε'}</span>
        </button>
      </div>

      {/* Right: Notifications, Theme Switcher, and User Profile */}
      <div className="topbar-right">


        {/* Streak Flame */}
        <div className="topbar-rewards-badge streak" title={`Daily Streak: ${profile.streak} days`}>
          🔥 {profile.streak}
        </div>

        {/* Coins Badge */}
        <div className="topbar-rewards-badge coins" title={`Coins: ${profile.coins}`}>
          🪙 {profile.coins}
        </div>

        {/* Level & XP progression */}
        <div className="topbar-xp-badge" title={`Level ${profile.level}: ${profile.xp} / ${profile.level * 500} XP`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-cyan)' }}>Lv. {profile.level}</span>
            <span style={{ fontSize: '8px', color: 'var(--text-dimmed)', fontFamily: 'var(--font-mono)' }}>{profile.xp}/{profile.level * 500}</span>
          </div>
          <div className="topbar-xp-progress-bg">
            <div className="topbar-xp-progress-fill" style={{ width: `${(profile.xp / (profile.level * 500)) * 100}%` }} />
          </div>
        </div>

        {/* Divider line */}
        <div className="topbar-vertical-divider" />

        {/* User profile avatar placeholder */}
        <div 
          className="topbar-user-avatar-badge" 
          title={`Profile: ${profile.username || 'Student Learner'}`}
          onClick={() => onTabChange?.('profile')}
          style={{ cursor: 'pointer' }}
        >
          {profile.avatar && profile.avatar.startsWith('http') ? (
            <img 
              src={profile.avatar} 
              alt="User Avatar" 
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
            />
          ) : (
            <div className="user-initials">
              {((profile.username || 'AV').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase())}
            </div>
          )}
          <div className="user-active-indicator" />
        </div>
      </div>
    </header>
  );
};

export default Topbar;
