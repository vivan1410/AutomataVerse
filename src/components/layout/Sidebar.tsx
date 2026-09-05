import React, { useState, useEffect } from 'react';
import './Sidebar.css';
import { AppTab } from '../../App';

// Consistent stroke-width Lucide-style SVG Icons
const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);

const DfaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2.5 3 6 3s6-1 6-3v-5"/></svg>
);

const NfaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);

const AiTutorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M9 13h.01M15 13h.01M10 16h4"/></svg>
);

const ChallengesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><path d="M6 12h4M8 10v4M15 13h.01M18 11h.01"/></svg>
);

const SimulatorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>
);



const ProfileIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const TrophyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-2.34"/><path d="M12 2a4 4 0 0 0-4 4v3a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z"/></svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
);

interface SidebarProps {
  isOpen: boolean;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onLogout?: () => void;
  profile?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeTab, setActiveTab, onLogout, profile }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<string>('home');

  // Synchronize current view highlight based on activeTab
  useEffect(() => {
    if (activeTab === 'home') setActiveItem('home');
    else if (activeTab === 'dfa-academy') setActiveItem('dfa');
    else if (activeTab === 'nfa-academy') setActiveItem('nfa');
    else if (activeTab === 'ai-tutor') setActiveItem('ai-tutor');
    else if (activeTab === 'challenges') setActiveItem('challenges');
    else if (activeTab === 'canvas') setActiveItem('simulator');
    else if (activeTab === 'profile') setActiveItem('profile');
    else if (activeTab === 'achievements') setActiveItem('achievements');
    else if (activeTab === 'settings') setActiveItem('settings');
  }, [activeTab]);

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  const sections = [
    {
      title: 'LEARN',
      items: [
        { id: 'dfa', name: 'DFA Academy', tab: 'dfa-academy', icon: <DfaIcon /> },
        { id: 'nfa', name: 'NFA Academy', tab: 'nfa-academy', icon: <NfaIcon /> },
        { id: 'ai-tutor', name: 'AI Tutor', tab: 'ai-tutor', icon: <AiTutorIcon /> }
      ]
    },
    {
      title: 'PLAY',
      items: [
        { id: 'challenges', name: 'Challenges', tab: 'challenges', mode: 'GAMES', icon: <ChallengesIcon /> },
        { id: 'simulator', name: 'Simulator', tab: 'canvas', icon: <SimulatorIcon /> }
      ]
    },
    {
      title: 'PROFILE',
      items: [
        { id: 'profile', name: 'Profile', tab: 'profile', icon: <ProfileIcon /> },
        { id: 'achievements', name: 'Achievements', tab: 'achievements', icon: <TrophyIcon /> },
        { id: 'settings', name: 'Settings', tab: 'settings', icon: <SettingsIcon /> }
      ]
    }
  ];

  const handleNavClick = (id: string, tab: AppTab, mode?: string) => {
    setActiveItem(id);
    if (mode) {
      sessionStorage.setItem('av_challenges_mode', mode);
    }
    setActiveTab(tab);
  };

  // Profile status details
  const username = profile?.username || 'Alex Vance';
  const coins = profile?.coins || 0;
  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const avatar = profile?.avatar || '';
  const xpPercent = Math.round(((xp % 500) / 500) * 100);

  return (
    <aside className={`av-sidebar ${isOpen ? '' : 'collapsed'}`}>
      
      {/* Workspace Switcher Header */}
      <div className="sidebar-header">
        <div className="workspace-switcher" onClick={toggleDropdown}>
          <div className="workspace-info">
            <div className="workspace-avatar">AV</div>
            <span className="workspace-name">AutomataVerse</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}>
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="workspace-dropdown-menu">
            <div className="dropdown-section-title">Workspaces</div>
            <div className="dropdown-item active" onClick={() => setDropdownOpen(false)}>
              <span className="workspace-badge-name">AutomataVerse Personal</span>
              <span className="workspace-badge-active">Active</span>
            </div>
            <div className="dropdown-item" onClick={() => {
              alert('Workspace Switching is a mock action for the app shell.');
              setDropdownOpen(false);
            }}>
              Logic Team Pipeline
            </div>
          </div>
        )}
      </div>

      {/* Main content nav list */}
      <div className="sidebar-content">
        
        {/* Special General section for Home */}
        <div className="sidebar-section-group">
          <div 
            className={`nav-item-interactive ${activeItem === 'home' ? 'active' : ''}`}
            data-tooltip="Home"
            onClick={() => handleNavClick('home', 'home')}
          >
            <div className="nav-item-left">
              <span className="nav-item-icon"><HomeIcon /></span>
              <span className="nav-item-text">Home</span>
            </div>
          </div>
        </div>

        {sections.map((sec) => (
          <div key={sec.title} className="sidebar-section-group">
            <h4 className="nav-section-title">{sec.title}</h4>
            {sec.items.map((item) => {
              const isActive = activeItem === item.id;
              return (
                <div
                  key={item.id}
                  className={`nav-item-interactive ${isActive ? 'active' : ''}`}
                  data-tooltip={item.name}
                  onClick={() => handleNavClick(item.id, item.tab as AppTab, item.mode)}
                >
                  <div className="nav-item-left">
                    <span className="nav-item-icon">{item.icon}</span>
                    <span className="nav-item-text">{item.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Premium user card profile footer */}
      <div className="sidebar-footer">
        <div className="premium-user-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <div className="user-avatar-wrapper">
              <div className="user-avatar-avatar">
                {avatar && avatar.startsWith('http') ? (
                  <img 
                    src={avatar} 
                    alt="User Profile" 
                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                ) : (
                  username.substring(0, 2).toUpperCase()
                )}
              </div>
              <span className="online-indicator" />
            </div>
            
            <div className="user-text-info">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span className="user-name">{username}</span>
                {onLogout && (
                  <button onClick={onLogout} className="logout-btn-icon" title="Sign Out">
                    <LogoutIcon />
                  </button>
                )}
              </div>
              <span className="user-role">Level {level} Explorer</span>
            </div>
          </div>

          <div className="user-xp-coins-stats">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--sidebar-text-muted)', fontWeight: 700 }}>
              <span>XP Progress</span>
              <span>{xp % 500} / 500 XP</span>
            </div>
            <div className="xp-bar-track">
              <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '6px', fontWeight: 800 }}>
              <span style={{ color: '#F59E0B' }}>🪙 {coins} Coins</span>
              <span style={{ color: 'var(--accent-cyan)' }}>Total: {xp} XP</span>
            </div>
          </div>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;
