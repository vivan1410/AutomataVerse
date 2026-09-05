import React, { useState, useEffect } from 'react';
import './Achievements.css';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface AchievementItem {
  id: string;
  name: string;
  desc: string;
  icon: string;
  category: 'Academy' | 'Simulator' | 'Challenges';
  rewardXp: number;
  rewardCoins: number;
  unlocked: boolean;
  dateEarned?: string;
}

interface AchievementsProps {
  profile: any;
  awardRewards?: (type: 'lesson' | 'quiz' | 'challenge' | 'achievement', id: string, extra?: any) => void;
  showToast?: (message: string) => void;
}

export const Achievements: React.FC<AchievementsProps> = ({ profile, awardRewards }) => {
  const [achievements, setAchievements] = useState<AchievementItem[]>([
    { id: 'dfa_beginner', name: 'DFA Beginner', desc: 'Complete the DFA introduction lesson.', icon: '🎓', category: 'Academy', rewardXp: 100, rewardCoins: 10, unlocked: false },
    { id: 'transition_master', name: 'Transition Master', desc: 'Complete the Transition Function lesson.', icon: '🔀', category: 'Academy', rewardXp: 150, rewardCoins: 15, unlocked: false },
    { id: 'nfa_graduate', name: 'NFA Graduate', desc: 'Complete ALL NFA lessons.', icon: '⚛️', category: 'Academy', rewardXp: 200, rewardCoins: 20, unlocked: false },
    { id: 'regex_expert', name: 'Regex Expert', desc: 'Complete Regex course.', icon: '📜', category: 'Academy', rewardXp: 200, rewardCoins: 20, unlocked: false },
    { id: 'simulation_expert', name: 'Simulation Expert', desc: 'Finish Simulator tutorial.', icon: '🏗️', category: 'Simulator', rewardXp: 100, rewardCoins: 10, unlocked: false },
    { id: 'speed_solver', name: 'Speed Solver', desc: 'Complete one Speed Challenge.', icon: '⚡', category: 'Challenges', rewardXp: 100, rewardCoins: 10, unlocked: false },
    { id: 'perfect_accuracy', name: 'Perfect Accuracy', desc: '80%+ accuracy across 20 questions.', icon: '🎯', category: 'Challenges', rewardXp: 250, rewardCoins: 25, unlocked: false },
    { id: 'streak_7', name: '7-Day Streak', desc: 'Study for seven consecutive days.', icon: '🔥', category: 'Challenges', rewardXp: 150, rewardCoins: 15, unlocked: false },
    { id: 'questions_100', name: '100 Questions Solved', desc: 'Solve 100 practice questions.', icon: '📈', category: 'Challenges', rewardXp: 300, rewardCoins: 30, unlocked: false },
    { id: 'master_builder', name: 'Master Builder', desc: 'Complete 5 builder challenges.', icon: '👑', category: 'Challenges', rewardXp: 300, rewardCoins: 30, unlocked: false }
  ]);

  const [filterCategory, setFilterCategory] = useState<'All' | 'Academy' | 'Simulator' | 'Challenges'>('All');
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementItem | null>(null);

  // Synchronize unlocked state with profile.achievements reactively
  useEffect(() => {
    setAchievements((prev) =>
      prev.map((ach) => {
        const isUnlocked = profile.achievements?.includes(ach.id) || false;
        
        // Mock date earned if unlocked and not saved yet
        const dateStr = localStorage.getItem(`av_ach_date_${ach.id}`) || new Date().toISOString().split('T')[0];
        if (isUnlocked && !localStorage.getItem(`av_ach_date_${ach.id}`)) {
          localStorage.setItem(`av_ach_date_${ach.id}`, dateStr);
        }

        return {
          ...ach,
          unlocked: isUnlocked,
          dateEarned: isUnlocked ? dateStr : undefined
        };
      })
    );
  }, [profile.achievements]);

  const handleTestUnlock = (id: string) => {
    const ach = achievements.find((a) => a.id === id)!;
    if (ach.unlocked) return;

    const dateStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(`av_ach_date_${id}`, dateStr);

    setAchievements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, unlocked: true, dateEarned: dateStr } : a))
    );

    // Call awardRewards ONLY during explicit completion click to prevent recurrent runs
    awardRewards?.('achievement', ach.id, { bonusCoins: ach.rewardCoins, bonusXp: ach.rewardXp });
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const completionPercent = Math.round((unlockedCount / achievements.length) * 100);

  const filteredAchievements = filterCategory === 'All'
    ? achievements
    : achievements.filter((a) => a.category === filterCategory);

  return (
    <div className="achievements-container av-tab-transition">
      {/* Trophy Header Section */}
      <div className="achievements-header">
        <div>
          <span className="achievements-mini-title">Trophy Achievements Book</span>
          <h1 className="achievements-title-main">Achievements Gallery</h1>
        </div>
        <div className="achievements-summary-badge">
          <span>🏆 Progress: <strong>{unlockedCount} / {achievements.length}</strong> Unlocked</span>
          <div className="summary-percentage-bar-bg">
            <div className="summary-percentage-bar-fill" style={{ width: `${completionPercent}%` }}></div>
          </div>
          <span className="summary-lbl">{completionPercent}% Complete</span>
        </div>
      </div>

      {/* Filter Options */}
      <div className="achievements-filter-bar">
        {['All', 'Academy', 'Simulator', 'Challenges'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat as any)}
            className={`filter-btn ${filterCategory === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Achievements Catalog List */}
      <div className="achievements-catalog-grid">
        {filteredAchievements.map((ach) => (
          <Card
            key={ach.id}
            glass
            className={`achievement-card-detailed ${ach.unlocked ? 'unlocked' : 'locked'}`}
            onClick={() => setSelectedAchievement(ach)}
          >
            <div className="ach-card-header-row">
              <span className="ach-category-tag">{ach.category}</span>
              <span className="ach-status-label">{ach.unlocked ? '✓ Unlocked' : '🔒 Locked'}</span>
            </div>
            
            <div className="ach-card-body-row">
              <div className="ach-badge-avatar">
                {ach.icon}
              </div>
              <div className="ach-details-block">
                <h3 className="ach-card-name">{ach.name}</h3>
                <p className="ach-card-desc">{ach.desc}</p>
                <div className="ach-rewards-row">
                  <span className="reward-tag xp">💎 +{ach.rewardXp} XP</span>
                  <span className="reward-tag coins">🪙 +{ach.rewardCoins} Coins</span>
                </div>
              </div>
            </div>

            {ach.unlocked ? (
              <div className="ach-unlocked-date">
                Earned on: {ach.dateEarned}
              </div>
            ) : (
              <div className="ach-test-unlock-container">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestUnlock(ach.id);
                  }}
                  className="test-unlock-btn"
                >
                  Simulate Unlock
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Achievement Detail Overlay */}
      {selectedAchievement && (
        <div className="achievement-overlay" onClick={() => setSelectedAchievement(null)}>
          <Card
            glass
            className="achievement-detail-dialog animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="detail-avatar-halo">
              {selectedAchievement.icon}
            </div>
            <h2 className="detail-name">{selectedAchievement.name}</h2>
            <span className="detail-category">{selectedAchievement.category} Category</span>
            <p className="detail-desc">{selectedAchievement.desc}</p>
            
            <div className="detail-rewards-box">
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-dimmed)', marginBottom: '8px' }}>
                REWARDS FROM ACQUISITION:
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <span className="reward-badge-large xp">XP: +{selectedAchievement.rewardXp}</span>
                <span className="reward-badge-large coins">Coins: +{selectedAchievement.rewardCoins}</span>
              </div>
            </div>

            {selectedAchievement.unlocked ? (
              <div className="detail-unlock-status unlocked">
                ✓ Unlocked and Claimed. Earned: {selectedAchievement.dateEarned}
              </div>
            ) : (
              <div className="detail-unlock-status locked">
                🔒 Lock Constraint Active. Complete requirements to unlock.
              </div>
            )}

            <Button variant="secondary" size="sm" onClick={() => setSelectedAchievement(null)} style={{ width: '100%' }}>
              Dismiss Details
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Achievements;
