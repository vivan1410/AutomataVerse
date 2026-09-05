import React, { useState, useEffect } from 'react';
import './BadgeCollection.css';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface BadgeItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlocked: boolean;
}

export const BadgeCollection: React.FC = () => {
  const [badges, setBadges] = useState<BadgeItem[]>([
    { id: 'b1', name: 'DFA Beginner', desc: 'Unlocked initially upon completing the first lesson.', icon: '🎓', unlocked: false },
    { id: 'b2', name: 'Transition Master', desc: 'Unlocks by completing Lesson 3 (Transition Function).', icon: '🔀', unlocked: false },
    { id: 'b3', name: 'Speed Solver', desc: 'Successfully solve a question sequence in the Arcade Speed Challenge.', icon: '⚡', unlocked: false },
    { id: 'b4', name: 'Perfect Accuracy', desc: 'Reach 80% accuracy index rates in Academy learning dashboard.', icon: '🎯', unlocked: false },
    { id: 'b5', name: '7-Day Streak', desc: 'Achieve a consecutive learning streak (streak count >= 2).', icon: '🔥', unlocked: false },
    { id: 'b6', name: 'Puzzle Champion', desc: 'Successfully solve any game challenge in Mini Games Hub.', icon: '🧩', unlocked: false },
    { id: 'b7', name: 'DFA Architect', desc: 'Construct a correct machine pattern in DFA Builder Challenge.', icon: '🏗️', unlocked: false },
    { id: 'b8', name: 'Simulator Expert', desc: 'Explore transition nodes inside DFA simulator views.', icon: '🛠️', unlocked: false }
  ]);

  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const [celebrateBadge, setCelebrateBadge] = useState<BadgeItem | null>(null);

  // Compute Unlocked Badges based on LocalStorage on mount
  useEffect(() => {
    // 1. Academy Lessons
    let completedLesson1 = false;
    let completedLesson3 = false;
    try {
      const lessonsSaved = localStorage.getItem('av_dfa_academy_lessons');
      if (lessonsSaved) {
        const parsed = JSON.parse(lessonsSaved);
        if (parsed['1']?.completed) completedLesson1 = true;
        if (parsed['3']?.completed) completedLesson3 = true;
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Academy Analytics & Streak
    let accuracyRate = 0;
    let streakCount = 1;
    try {
      const analyticsSaved = localStorage.getItem('av_dfa_academy_analytics');
      if (analyticsSaved) {
        const parsed = JSON.parse(analyticsSaved);
        streakCount = parsed.streak || 1;
        const total = (parsed.correctAnswers || 0) + (parsed.incorrectAnswers || 0);
        if (total > 0) {
          accuracyRate = (parsed.correctAnswers || 0) / total;
        }
      }
    } catch (e) {
      console.error(e);
    }

    // 3. User Profile
    let xpCount = 0;
    try {
      const profileSaved = localStorage.getItem('av_user_profile');
      if (profileSaved) {
        const parsed = JSON.parse(profileSaved);
        xpCount = parsed.xp || 0;
        if (parsed.streak && parsed.streak > streakCount) {
          streakCount = parsed.streak;
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Update badges unlocked flags
    setBadges((prev) =>
      prev.map((b) => {
        let isUnlocked = false;
        
        if (b.id === 'b1') isUnlocked = completedLesson1;
        else if (b.id === 'b2') isUnlocked = completedLesson3;
        else if (b.id === 'b3') isUnlocked = xpCount > 50; // Earned from speed round or similar
        else if (b.id === 'b4') isUnlocked = accuracyRate >= 0.8 || completedLesson1;
        else if (b.id === 'b5') isUnlocked = streakCount >= 2;
        else if (b.id === 'b6') isUnlocked = xpCount > 80;
        else if (b.id === 'b7') isUnlocked = completedLesson3;
        else if (b.id === 'b8') isUnlocked = true; // Simulator expert - free starter explore badge!

        return { ...b, unlocked: isUnlocked };
      })
    );
  }, []);

  const handleTestUnlock = (badgeId: string) => {
    const badge = badges.find((b) => b.id === badgeId)!;
    if (badge.unlocked) return; // already unlocked

    // Simulate unlock with celebration effect!
    setBadges((prev) =>
      prev.map((b) => (b.id === badgeId ? { ...b, unlocked: true } : b))
    );
    setCelebrateBadge({ ...badge, unlocked: true });
  };

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="badge-collection-container">
      
      {/* ---------------- COLLECTION HEADER HEADER ---------------- */}
      <div className="badge-collection-header animate-scale-in">
        <div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Trophy Room</span>
          <h2 className="view-title" style={{ marginTop: '2px', fontSize: '20px' }}>Badge Collection</h2>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', fontSize: '13.5px', color: 'var(--text-main)', fontWeight: 600 }}>
          🏆 Progress: <span style={{ color: 'var(--accent-cyan)' }}>{unlockedCount} / {badges.length}</span> Badges
        </div>
      </div>

      {/* ---------------- BADGES GRID CATALOG ---------------- */}
      <div className="badge-grid">
        {badges.map((badge) => (
          <div 
            key={badge.id}
            onClick={() => setSelectedBadge(badge)}
            className={`badge-card ${badge.unlocked ? 'unlocked' : 'locked'} animate-scale-in`}
            style={{ cursor: 'pointer' }}
          >
            {badge.unlocked && <div className="celebration-burst" />}

            <div className="badge-avatar-frame">
              {badge.icon}
            </div>

            <h4 className="badge-title">{badge.name}</h4>
            <p className="badge-desc">{badge.desc}</p>

            {/* Test unlock helper callout button */}
            {!badge.unlocked && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => { e.stopPropagation(); handleTestUnlock(badge.id); }}
                style={{ fontSize: '10px', height: '20px', padding: '0 6px', color: 'var(--accent-cyan)', border: '1px solid rgba(61,235,255,0.15)', marginTop: '4px' }}
              >
                Test Unlock
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* ---------------- CELEBRATION MODAL OVERLAY ---------------- */}
      {celebrateBadge && (
        <div className="badge-celebration-overlay">
          <Card glass style={{ padding: '40px', maxWidth: '360px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', boxShadow: '0 0 40px var(--accent-cyan-glow)' }} className="animate-scale-in">
            <div className="badge-halo">
              {celebrateBadge.icon}
            </div>

            <div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>New Badge Earned!</span>
              <h2 style={{ fontSize: '26px', marginTop: '6px', color: 'var(--text-main)' }}>{celebrateBadge.name}</h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.45 }}>
                {celebrateBadge.desc}
              </p>
            </div>

            <Button variant="primary" size="md" onClick={() => setCelebrateBadge(null)} glow>
              Awesome!
            </Button>
          </Card>
        </div>
      )}

      {/* ---------------- DETAIL VIEW DIALOG ---------------- */}
      {selectedBadge && !celebrateBadge && (
        <div className="badge-celebration-overlay" onClick={() => setSelectedBadge(null)}>
          <Card 
            glass 
            style={{ padding: '32px', maxWidth: '340px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }} 
            className="animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: selectedBadge.unlocked ? 'rgba(61,235,255,0.05)' : 'rgba(255,255,255,0.02)',
              border: '2px solid',
              borderColor: selectedBadge.unlocked ? 'var(--accent-cyan)' : 'var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '44px',
              filter: selectedBadge.unlocked ? 'none' : 'grayscale(1)'
            }}>
              {selectedBadge.icon}
            </div>

            <div>
              <span style={{ fontSize: '10px', fontWeight: 600, color: selectedBadge.unlocked ? 'var(--accent-success)' : 'var(--text-dimmed)', textTransform: 'uppercase' }}>
                {selectedBadge.unlocked ? '✓ Unlocked' : '🔒 Locked Achievement'}
              </span>
              <h3 style={{ fontSize: '20px', marginTop: '6px', color: 'var(--text-main)' }}>{selectedBadge.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.45 }}>
                {selectedBadge.desc}
              </p>
            </div>

            <Button variant="secondary" size="sm" onClick={() => setSelectedBadge(null)} style={{ width: '100%' }}>
              Close Details
            </Button>
          </Card>
        </div>
      )}

    </div>
  );
};

export default BadgeCollection;
