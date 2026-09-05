import React from 'react';
import { Card } from './Card';
import { 
  AcademyIcon, 
  BoxIcon, 
  SettingsIcon, 
  PlayIcon, 
  CodeIcon, 
  TrophyIcon 
} from './Icon';

interface LessonCardProps {
  id: number;
  title: string;
  desc: string;
  time: string;
  difficulty: string;
  iconType: string;
  isCompleted: boolean;
  isActive?: boolean;
  onClick: () => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  id,
  title,
  desc,
  time,
  difficulty,
  iconType,
  isCompleted,
  isActive = false,
  onClick
}) => {
  const renderIcon = (type: string) => {
    if (type === 'academy') return <AcademyIcon size={16} color="var(--accent-cyan)" />;
    if (type === 'box') return <BoxIcon size={16} color="var(--accent-cyan)" />;
    if (type === 'settings') return <SettingsIcon size={16} color="var(--accent-purple)" />;
    if (type === 'play') return <PlayIcon size={16} color="var(--accent-cyan)" />;
    if (type === 'code') return <CodeIcon size={16} color="var(--accent-warning)" />;
    return <TrophyIcon size={16} color="var(--accent-warning)" />;
  };

  return (
    <Card
      id={`lesson-card-${id}`}
      glass
      interactive={true}
      glow={isActive || !isCompleted}
      className={`lesson-card-interactive ${isActive ? 'selected' : ''}`}
      onClick={onClick}
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {isActive && (
        <div className="active-deck-badge">
          Active ✓
        </div>
      )}
      <div className="lesson-badge-row">
        <span className={`lesson-badge ${difficulty.toLowerCase() === 'intermediate' ? 'intermediate' : difficulty.toLowerCase() === 'advanced' ? 'advanced' : ''}`}>
          {difficulty}
        </span>
        <div className={`status-indicator-icon ${isCompleted ? 'completed' : 'unlocked'}`}>
          {isCompleted ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
            </svg>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div className="feature-icon-box" style={{ width: '34px', height: '34px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'nowrap' }}>
          {renderIcon(iconType)}
        </div>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>{title}</h3>
          <span className="lesson-meta-text">{time}</span>
        </div>
      </div>

      <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {desc}
      </p>
    </Card>
  );
};

export default LessonCard;
