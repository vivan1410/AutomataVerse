import React, { useState, useEffect } from 'react';
import './Profile.css';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AppTab } from '../../App';

interface UserProfile {
  xp: number;
  coins: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  username?: string;
  email?: string;
  avatar?: string;
  joinDate?: string;
  totalTimeSpent?: number;
  questionsSolved?: number;
  practiceSessions?: number;
  challengeSessions?: number;
  bestAccuracy?: number;
  longestStreak?: number;
  questionsSolvedCount?: number;
  correctAnswersCount?: number;
  totalAnswersCount?: number;
  lessonsCompleted?: string[];
  chaptersCompleted?: number[];
  quizzesCompleted?: string[];
  challengesSolved?: string[];
  achievements?: string[];
}

interface ProfileProps {
  profile: UserProfile;
  updateProfile: (details: Partial<UserProfile>) => void;
  showToast?: (msg: string) => void;
  onLogout?: () => void;
  setActiveTab: (tab: AppTab) => void;
}

export const Profile: React.FC<ProfileProps> = ({ profile, updateProfile, showToast, onLogout, setActiveTab }) => {
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState(profile.username || '');

  // Handle scroll navigation from Home page
  useEffect(() => {
    const scrollTarget = sessionStorage.getItem('av_nav_scroll_target');
    if (scrollTarget === 'statistics') {
      sessionStorage.removeItem('av_nav_scroll_target');
      setTimeout(() => {
        const element = document.getElementById('statistics-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          element.classList.add('highlight-nav-target');
          setTimeout(() => element.classList.remove('highlight-nav-target'), 2000);
        }
      }, 100);
    }
  }, []);
  const [email, setEmail] = useState(profile.email || '');
  const [avatar, setAvatar] = useState(profile.avatar || '🧙‍♂️ Wizard');

  const avatarsList = ['🧙‍♂️ Wizard', '🥷 Ninja', '🕵️ Detective', '🤖 Android', '👾 Glitch', '🐱 Scholar'];

  const handleSave = () => {
    if (!username.trim()) {
      alert('Username cannot be empty!');
      return;
    }
    updateProfile({ username, email, avatar });
    setEditMode(false);
    showToast?.('👤 Profile updated successfully!');
  };

  const handleCancel = () => {
    setUsername(profile.username || '');
    setEmail(profile.email || '');
    setAvatar(profile.avatar || '🧙‍♂️ Wizard');
    setEditMode(false);
  };

  return (
    <div className="profile-container av-tab-transition">
      {/* Profile Identity Card */}
      <Card glass className="profile-identity-card">
        <div className="profile-header-layout">
          <div className="profile-avatar-frame-large">
            {avatar && avatar.startsWith('http') ? (
              <img 
                src={avatar} 
                alt="Profile Avatar" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
              />
            ) : (
              avatar.split(' ')[0]
            )}
          </div>

          <div className="profile-details-column">
            {editMode ? (
              <div className="profile-edit-form">
                <div className="form-group">
                  <label>Display Username</label>
                  <input
                    type="text"
                    className="profile-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="profile-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Choose Avatar Icon</label>
                  <div className="avatar-picker-row">
                    {avatarsList.map((av) => (
                      <button
                        key={av}
                        type="button"
                        className={`avatar-option-btn ${avatar === av ? 'selected' : ''}`}
                        onClick={() => setAvatar(av)}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-actions">
                  <Button variant="primary" size="sm" onClick={handleSave} glow>
                    Save Changes
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="profile-display-view">
                <div className="name-level-row">
                  <h1 className="profile-display-name">{profile.username}</h1>
                  <span className="profile-level-badge">LEVEL {profile.level}</span>
                </div>
                <div className="profile-display-email">{profile.email}</div>
                <div className="profile-metadata-row">
                  <span>📅 Joined: {profile.joinDate}</span>
                  <span>💎 Status: Pro Learner</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                    Edit Profile Account
                  </Button>
                  {onLogout && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={onLogout}
                      style={{ 
                        borderColor: '#ff4d4d', 
                        color: '#ff4d4d', 
                        background: 'transparent'
                      }}
                    >
                      Log Out
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Account Performance Statistics Grid */}
      <h2 id="statistics-section" className="profile-section-headline">Account Performance & Statistics</h2>
      
      <div className="profile-stats-grid">
        {[
          { 
            label: 'Current Level', 
            val: `Lvl ${profile.level || 1}`, 
            sub: `${profile.xp || 0} / ${profile.level === 1 ? 100 : profile.level === 2 ? 250 : profile.level === 3 ? 500 : profile.level === 4 ? 800 : 800 + (profile.level - 4) * 400} XP`, 
            icon: '⭐', 
            color: 'cyan' 
          },
          { 
            label: 'Gold Coins', 
            val: `🪙 ${profile.coins || 0}`, 
            sub: 'Redeemable currency', 
            icon: '🪙', 
            color: 'warning' 
          },
          { 
            label: 'Total XP Earned', 
            val: `${profile.xp || 0} XP`, 
            sub: 'All-time experience accumulated', 
            icon: '💎', 
            color: 'purple' 
          },
          { 
            label: 'Questions Solved', 
            val: `${profile.questionsSolvedCount || 0} Answers`, 
            sub: 'From DFA & NFA drills', 
            icon: '🎯', 
            color: 'success' 
          },
          { 
            label: 'Best Accuracy Rate', 
            val: `${profile.totalAnswersCount ? Math.round(((profile.correctAnswersCount || 0) / profile.totalAnswersCount) * 100) : 0}%`, 
            sub: 'Average correct answer ratio', 
            icon: '📈', 
            color: 'cyan' 
          },
          { 
            label: 'Total Learning Time', 
            val: `${profile.totalTimeSpent || 0} Mins`, 
            sub: 'Active course interaction duration', 
            icon: '⏱️', 
            color: 'purple' 
          },
          { 
            label: 'Practice Sessions', 
            val: `${profile.practiceSessions || 0} Runs`, 
            sub: 'Quiz bank exploration sessions', 
            icon: '📝', 
            color: 'warning' 
          },
          { 
            label: 'Challenge Runs', 
            val: `${profile.challengeSessions || 0} Speed trials`, 
            sub: 'Timed puzzle achievements', 
            icon: '⚡', 
            color: 'error' 
          },
          { 
            label: 'Streaks Record', 
            val: `🔥 ${profile.streak || 0} Days`, 
            sub: `Longest streak record: ${profile.longestStreak || 0} days`, 
            icon: '🔥', 
            color: 'error' 
          }
        ].map((stat, idx) => (
          <Card key={idx} glass className={`profile-stat-card border-glow-${stat.color}`}>
            <div className="stat-card-top">
              <span className="stat-card-icon">{stat.icon}</span>
              <span className="stat-card-label">{stat.label}</span>
            </div>
            <div className="stat-card-val">{stat.val}</div>
            <div className="stat-card-sub">{stat.sub}</div>
          </Card>
        ))}
      </div>

      {/* Unlocked Badges section */}
      <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="profile-section-headline" style={{ margin: 0 }}>Unlocked Badges</h2>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Unlocked Badges: <strong>{profile.achievements ? profile.achievements.length : 0} / 10</strong>
            </span>
          </div>
          <Button variant="primary" size="sm" onClick={() => setActiveTab('achievements')}>
            View All Achievements 🏆
          </Button>
        </div>

        {(!profile.achievements || profile.achievements.length === 0) ? (
          <Card glass style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-medium)', width: '100%' }}>
            No achievements unlocked yet. Complete lessons and challenges to earn badges!
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {[
              { id: 'dfa_beginner', name: 'DFA Beginner', icon: '🎓', desc: 'Complete the DFA introduction lesson.' },
              { id: 'transition_master', name: 'Transition Master', icon: '🔀', desc: 'Complete the Transition Function lesson.' },
              { id: 'nfa_graduate', name: 'NFA Graduate', icon: '⚛️', desc: 'Complete ALL NFA lessons.' },
              { id: 'regex_expert', name: 'Regex Expert', icon: '📜', desc: 'Complete Regex course.' },
              { id: 'simulation_expert', name: 'Simulation Expert', icon: '🏗️', desc: 'Finish Simulator tutorial.' },
              { id: 'speed_solver', name: 'Speed Solver', icon: '⚡', desc: 'Complete one Speed Challenge.' },
              { id: 'perfect_accuracy', name: 'Perfect Accuracy', icon: '🎯', desc: '80%+ accuracy across 20 questions.' },
              { id: 'streak_7', name: '7-Day Streak', icon: '🔥', desc: 'Study for seven consecutive days.' },
              { id: 'questions_100', name: '100 Questions Solved', icon: '📈', desc: 'Solve 100 practice questions.' },
              { id: 'master_builder', name: 'Master Builder', icon: '👑', desc: 'Complete 5 builder challenges.' },
            ]
              .filter((badge) => profile.achievements?.includes(badge.id))
              .map((badge) => (
                <Card key={badge.id} glass style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1.5px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '24px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {badge.icon}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{badge.name}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{badge.desc}</p>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
