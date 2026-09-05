import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AppTab } from '../../App';

interface UserProfile {
  xp: number;
  coins: number;
  level: number;
}

interface ChallengesPageProps {
  profile: UserProfile;
  setActiveTab: (tab: AppTab) => void;
  awardRewards?: (type: 'lesson' | 'quiz' | 'challenge' | 'achievement', id: string, extra?: any) => void;
  showToast?: (message: string) => void;
}

interface ChallengeCard {
  id: string;
  title: string;
  desc: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Hard' | 'Mixed';
  xpReward: number;
  coinReward: number;
  playAction: () => void;
}

export const ChallengesPage: React.FC<ChallengesPageProps> = ({
  setActiveTab,
  showToast
}) => {
  const challenges: ChallengeCard[] = [
    {
      id: 'speed-challenge',
      title: 'Speed Challenge',
      desc: 'Timed Theory of Computation evaluation. Race against the laser countdown clock!',
      difficulty: 'Intermediate',
      xpReward: 40,
      coinReward: 10,
      playAction: () => {
        sessionStorage.setItem('av_challenges_mode', 'SPEED_ROUND');
        sessionStorage.setItem('av_game_type', 'SPEED_CHALLENGE');
        setActiveTab('activity');
        showToast?.('⚡ Speed Challenge Quiz Launched!');
      }
    },
    {
      id: 'practice-arena',
      title: 'Practice Arena',
      desc: 'Hone your tracing skills with unlimited automata transition drills. Relaxed mode, zero timers.',
      difficulty: 'Mixed',
      xpReward: 25,
      coinReward: 5,
      playAction: () => {
        sessionStorage.setItem('av_challenges_mode', 'SPEED_ROUND'); // Direct SpeedRound component
        sessionStorage.setItem('av_game_type', 'PRACTICE_ARENA');
        setActiveTab('activity');
        showToast?.('🏟️ Entered Practice Arena!');
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '8px 0', width: '100%' }}>
      <style>{`
        .challenges-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .challenges-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .challenges-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Header Panel */}
      <div style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Automata Sandbox Challenges
          </span>
          <h1 className="view-title" style={{ marginTop: '4px', marginBottom: '0px' }}>Challenges Hub</h1>
        </div>
      </div>

      {/* Grid List */}
      <div className="challenges-grid">
        {challenges.map((c) => (
          <Card 
            key={c.id} 
            glass 
            style={{ 
              padding: '24px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px',
              border: '1.5px solid var(--border-subtle)',
              height: '100%',
              minHeight: '260px',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span className={`lesson-badge ${
                  c.difficulty === 'Beginner' ? 'beginner' : 
                  c.difficulty === 'Intermediate' ? 'intermediate' : 
                  c.difficulty === 'Advanced' || c.difficulty === 'Hard' ? 'advanced' : ''
                }`}>
                  {c.difficulty}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 650 }}>
                  💎 {c.xpReward} XP
                </span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', margin: '8px 0 4px 0' }}>
                {c.title}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                {c.desc}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--accent-warning)', fontWeight: 700 }}>
                🪙 +{c.coinReward} Coins
              </span>
              <Button variant="primary" size="sm" onClick={c.playAction}>
                Play Challenge ➔
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ChallengesPage;
