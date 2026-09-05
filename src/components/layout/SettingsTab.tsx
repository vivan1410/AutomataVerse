import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface UserProfile {
  xp: number;
  coins: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  username?: string;
  email?: string;
  avatar?: string;
  joinDate?: string;
  lessonsCompleted?: string[];
  chaptersCompleted?: number[];
  quizzesCompleted?: string[];
  challengesSolved?: string[];
  achievements?: string[];
}

interface SettingsTabProps {
  gridVisible: boolean;
  gridSnap: boolean;
  toggleGrid: () => void;
  toggleSnap: () => void;
  showToast?: (m: string) => void;
  themeMode: 'dark' | 'light' | 'system';
  setThemeMode: (mode: 'dark' | 'light' | 'system') => void;
  profile?: UserProfile;
  onLogout?: () => void;
  updateProfile?: (details: Partial<UserProfile>) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  showToast,
  themeMode,
  setThemeMode,
  profile,
  onLogout,
  updateProfile
}) => {
  // --- Account State ---
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // --- Learning State ---
  const [difficulty, setDifficulty] = useState(() => {
    return localStorage.getItem('av_settings_difficulty') || 'Adaptive';
  });
  const [questionCount, setQuestionCount] = useState(() => {
    return Number(localStorage.getItem('av_settings_question_count') || '10');
  });
  const [autoExplanations, setAutoExplanations] = useState(() => {
    return localStorage.getItem('av_settings_auto_explanations') !== 'false';
  });

  // --- Appearance State ---
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('av_settings_accent_color') || 'purple';
  });

  // --- Notifications State ---
  const [notifyDaily, setNotifyDaily] = useState(() => {
    return localStorage.getItem('av_settings_notify_daily') !== 'false';
  });
  const [notifyAchievements, setNotifyAchievements] = useState(() => {
    return localStorage.getItem('av_settings_notify_achievements') !== 'false';
  });

  // --- Confirmation dialog states ---
  const [destructiveAction, setDestructiveAction] = useState<'RESET_STATS' | 'DELETE_ACCOUNT' | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('av_settings_difficulty', difficulty);
    localStorage.setItem('av_settings_question_count', questionCount.toString());
    localStorage.setItem('av_settings_auto_explanations', autoExplanations.toString());
    localStorage.setItem('av_settings_theme_mode', themeMode);
    localStorage.setItem('av_settings_accent_color', accentColor);
    localStorage.setItem('av_settings_notify_daily', notifyDaily.toString());
    localStorage.setItem('av_settings_notify_achievements', notifyAchievements.toString());
  }, [difficulty, questionCount, autoExplanations, themeMode, accentColor, notifyDaily, notifyAchievements]);

  const handleExport = () => {
    const data = { ...localStorage };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `automataverse_progress_${profile?.username || 'user'}.json`;
    link.click();
    showToast?.('💾 Profile progress exported successfully!');
  };

  const executeDestructiveAction = () => {
    if (destructiveAction === 'RESET_STATS') {
      localStorage.removeItem('av_nfa_practice_best_scores');
      localStorage.removeItem('av_nfa_learn_progress');
      localStorage.removeItem('av_nfa_qbank_attempts');
      localStorage.removeItem('av_nfa_qbank_corrects');
      localStorage.removeItem('av_custom_nfa_nodes');
      localStorage.removeItem('av_custom_nfa_edges');
      if (updateProfile) {
        updateProfile({
          xp: 0,
          coins: 0,
          level: 1,
          streak: 0,
          lessonsCompleted: [],
          chaptersCompleted: [],
          quizzesCompleted: [],
          challengesSolved: [],
          achievements: []
        });
      }
      showToast?.('🧹 Practice statistics reset successfully!');
    } else if (destructiveAction === 'DELETE_ACCOUNT') {
      localStorage.clear();
      showToast?.('⚠️ All settings and profile progress reset.');
      if (onLogout) {
        setTimeout(() => onLogout(), 1200);
      } else {
        setTimeout(() => window.location.reload(), 1200);
      }
    }
    setDestructiveAction(null);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currPassword || !newPassword) {
      alert('Please fill out all fields to change password.');
      return;
    }
    showToast?.('🔑 Password successfully updated!');
    setCurrPassword('');
    setNewPassword('');
  };

  const styles = {
    sectionTitle: {
      fontSize: '12px',
      fontWeight: 700,
      color: 'var(--accent-purple)',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.08em',
      borderBottom: '1px solid var(--border-subtle)',
      paddingBottom: '8px',
      marginBottom: '14px'
    },
    row: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid var(--border-subtle)'
    },
    label: {
      fontSize: '13.5px',
      fontWeight: 600,
      color: 'var(--text-main)'
    },
    desc: {
      fontSize: '11px',
      color: 'var(--text-dimmed)',
      marginTop: '2px'
    },
    select: {
      background: 'var(--bg-app)',
      border: '1px solid var(--border-medium)',
      color: 'var(--text-main)',
      padding: '5px 8px',
      borderRadius: '4px',
      fontSize: '12.5px',
      outline: 'none'
    },
    input: {
      background: 'var(--bg-app)',
      border: '1px solid var(--border-medium)',
      color: 'var(--text-main)',
      padding: '6px 12px',
      borderRadius: '4px',
      fontSize: '12.5px',
      outline: 'none',
      width: '180px'
    },
    toggleBtn: (active: boolean) => ({
      background: active ? 'rgba(123, 97, 255, 0.15)' : 'transparent',
      border: active ? '1.5px solid var(--accent-purple)' : '1.5px solid var(--border-medium)',
      color: active ? 'var(--text-main)' : 'var(--text-dimmed)',
      padding: '4px 12px',
      borderRadius: '4px',
      fontSize: '11.5px',
      cursor: 'pointer',
      transition: 'all 0.15s ease'
    })
  };

  const isGoogleConnected = profile?.email?.includes('@gmail.com') || localStorage.getItem('av_google_connected') === 'true';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', width: '100%', margin: '0 auto', padding: '10px 0' }}>

      {/* ================= 1. APPEARANCE ================= */}
      <Card glass style={{ padding: '20px' }}>
        <div style={styles.sectionTitle}>🎨 Appearance Settings</div>
        
        <div style={styles.row}>
          <div>
            <span style={styles.label}>Theme Mode</span>
            <div style={styles.desc}>Choose your preferred color interface theme.</div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['light', 'dark', 'system'].map((t) => (
              <button 
                key={t} 
                onClick={() => setThemeMode(t as any)} 
                style={styles.toggleBtn(themeMode === t)}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.row}>
          <div>
            <span style={styles.label}>Accent Highlight</span>
            <div style={styles.desc}>Select primary system highlight colors.</div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {[
              { id: 'cyan', hex: '#3debff' },
              { id: 'purple', hex: '#7b61ff' },
              { id: 'green', hex: '#10b981' },
              { id: 'orange', hex: '#f97316' }
            ].map((col) => (
              <button 
                key={col.id} 
                onClick={() => setAccentColor(col.id)} 
                style={{ 
                  width: '22px', 
                  height: '22px', 
                  borderRadius: '50%', 
                  background: col.hex, 
                  border: accentColor === col.id ? '2.5px solid #fff' : '1px solid rgba(255,255,255,0.2)', 
                  cursor: 'pointer', 
                  outline: 'none',
                  boxShadow: accentColor === col.id ? '0 0 8px rgba(255,255,255,0.4)' : 'none'
                }} 
              />
            ))}
          </div>
        </div>
      </Card>

      {/* ================= 2. LEARNING PREFERENCES ================= */}
      <Card glass style={{ padding: '20px' }}>
        <div style={styles.sectionTitle}>📚 Learning Preferences</div>
        
        <div style={styles.row}>
          <div>
            <span style={styles.label}>Default Difficulty</span>
            <div style={styles.desc}>Initial difficulty filters for quiz sets.</div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['Easy', 'Medium', 'Hard', 'Adaptive'].map((diff) => (
              <button 
                key={diff} 
                onClick={() => setDifficulty(diff)} 
                style={styles.toggleBtn(difficulty === diff)}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.row}>
          <div>
            <span style={styles.label}>Questions per Session</span>
            <div style={styles.desc}>Default count of questions generated per practice round.</div>
          </div>
          <select 
            value={questionCount} 
            onChange={(e) => setQuestionCount(Number(e.target.value))} 
            style={styles.select}
          >
            {[10, 20, 30, 50].map((n) => <option key={n} value={n}>{n} Questions</option>)}
          </select>
        </div>

        <div style={styles.row}>
          <div>
            <span style={styles.label}>Show Explanations</span>
            <div style={styles.desc}>Auto-reveal feedback details instantly upon submitting options.</div>
          </div>
          <Button 
            variant={autoExplanations ? "primary" : "secondary"} 
            size="sm" 
            onClick={() => setAutoExplanations(!autoExplanations)}
          >
            {autoExplanations ? 'Enabled' : 'Disabled'}
          </Button>
        </div>
      </Card>

      {/* ================= 3. NOTIFICATIONS ================= */}
      <Card glass style={{ padding: '20px' }}>
        <div style={styles.sectionTitle}>🔔 Notification Preferences</div>
        
        <div style={styles.row}>
          <div>
            <span style={styles.label}>Learning Reminders</span>
            <div style={styles.desc}>Daily local reminder indicators to preserve your active streaks.</div>
          </div>
          <Button 
            variant={notifyDaily ? "primary" : "secondary"} 
            size="sm" 
            onClick={() => setNotifyDaily(!notifyDaily)}
          >
            {notifyDaily ? 'ON' : 'OFF'}
          </Button>
        </div>

        <div style={styles.row}>
          <div>
            <span style={styles.label}>Achievement Alerts</span>
            <div style={styles.desc}>Glow modals and sound effect cues on unlocking accomplishments.</div>
          </div>
          <Button 
            variant={notifyAchievements ? "primary" : "secondary"} 
            size="sm" 
            onClick={() => setNotifyAchievements(!notifyAchievements)}
          >
            {notifyAchievements ? 'ON' : 'OFF'}
          </Button>
        </div>
      </Card>

      {/* ================= 4. ACCOUNT SETTINGS ================= */}
      <Card glass style={{ padding: '20px' }}>
        <div style={styles.sectionTitle}>👤 Account & Connection</div>
        
        <div style={styles.row}>
          <div>
            <span style={styles.label}>User Identity</span>
            <div style={styles.desc}>{profile?.email || 'Logged in as guest account'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isGoogleConnected ? (
              <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.08)', border: '1.5px solid var(--accent-cyan)', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                ✓ Google Auth Connected
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--text-dimmed)', border: '1px solid var(--border-subtle)', padding: '4px 10px', borderRadius: '12px' }}>
                Standard Password Account
              </span>
            )}
            {onLogout && (
              <Button variant="outline" size="sm" onClick={onLogout} style={{ height: '30px' }}>
                Log Out
              </Button>
            )}
          </div>
        </div>

        {!isGoogleConnected && (
          <form onSubmit={handlePasswordChange} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-main)' }}>Update Password</span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input 
                type="password" 
                placeholder="Current password" 
                value={currPassword}
                onChange={(e) => setCurrPassword(e.target.value)}
                style={styles.input}
              />
              <input 
                type="password" 
                placeholder="New password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={styles.input}
              />
              <Button variant="secondary" size="sm" type="submit" style={{ height: '32px' }}>
                Change Password
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* ================= 5. DANGER ZONE ================= */}
      <Card glass style={{ padding: '20px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.02)' }}>
        <div style={{ ...styles.sectionTitle, color: 'var(--accent-error)', borderColor: 'rgba(239, 68, 68, 0.15)' }}>⚠️ Danger Zone</div>
        
        <div style={styles.row}>
          <div>
            <span style={styles.label}>Export learning profile data</span>
            <div style={styles.desc}>Save your level achievements, practice records, and coins to a local JSON file.</div>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            Export Profile
          </Button>
        </div>

        <div style={styles.row}>
          <div>
            <span style={styles.label}>Clear learning progress</span>
            <div style={styles.desc}>Resets all course completion levels, custom exercises, and XP back to level 1.</div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setDestructiveAction('RESET_STATS')}
            style={{ color: 'var(--accent-error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            Clear Progress
          </Button>
        </div>

        <div style={{ ...styles.row, borderBottom: 'none' }}>
          <div>
            <span style={styles.label}>Delete system account</span>
            <div style={styles.desc}>Wipe all credentials and clear system configurations. This cannot be undone.</div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setDestructiveAction('DELETE_ACCOUNT')}
            style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--accent-error)', borderColor: 'var(--accent-error)' }}
          >
            Delete Account
          </Button>
        </div>
      </Card>

      {/* Confirmation Dialog Modal */}
      {destructiveAction !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <Card glass style={{ width: '380px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1.5px solid var(--accent-error)', background: 'var(--bg-card)' }} className="animate-scale-in">
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-error)' }}>🚨 Confirm Destructive Action</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
              Are you sure you want to perform this operation? This will erase related records or reset variables and cannot be undone!
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button variant="outline" size="sm" onClick={() => setDestructiveAction(null)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={executeDestructiveAction} 
                style={{ background: 'var(--accent-error)', borderColor: 'var(--accent-error)' }}
              >
                Confirm Reset
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};

export default SettingsTab;
