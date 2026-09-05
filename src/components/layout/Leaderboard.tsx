import React, { useState, useEffect } from 'react';
import './Leaderboard.css';
import { Card } from '../ui/Card';
import { apiService } from '../../services/api';

interface LeaderboardUser {
  rank: number;
  username: string;
  level: number;
  xp: number;
  coins: number;
  accuracy: number;
  isCurrentUser?: boolean;
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
  joinDate?: string;
  totalTimeSpent?: number;
  questionsSolved?: number;
  practiceSessions?: number;
  challengeSessions?: number;
  bestAccuracy?: number;
  longestStreak?: number;
}

interface LeaderboardProps {
  profile: UserProfile;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ profile }) => {
  const [boardType, setBoardType] = useState<'weekly' | 'alltime'>('weekly');
  const [boardData, setBoardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await apiService.getLeaderboard();
        if (response.success) {
          const cleanEmail = (profile.email || '').toLowerCase().trim();
          const mapped = response.leaderboard.map((u: any, idx: number) => {
            const isCurrentUser = (u.username === profile.username) || (u.email && u.email.toLowerCase().trim() === cleanEmail);
            return {
              rank: idx + 1,
              username: isCurrentUser ? `${profile.username || 'You'} (You)` : u.username,
              level: u.level,
              xp: u.xp,
              coins: u.coins,
              accuracy: u.accuracy || (isCurrentUser ? 90 : 85),
              isCurrentUser
            };
          });
          setBoardData(mapped);
        }
      } catch (err) {
        console.error('Failed to load leaderboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [profile.username, profile.xp]);

  const currentBoardData = boardData;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Retrieving rankings from mainframe...</span>
      </div>
    );
  }

  const userRankInfo = currentBoardData.find((u) => u.isCurrentUser);

  return (
    <div className="leaderboard-container av-tab-transition">
      {/* Header bar */}
      <div className="leaderboard-header">
        <div>
          <span className="leaderboard-mini-tag">Automata Masters Hall of Fame</span>
          <h1 className="leaderboard-title-text">Leaderboard Ranks</h1>
        </div>
        <div className="leaderboard-toggle-row">
          <button
            onClick={() => setBoardType('weekly')}
            className={`leaderboard-tab-btn ${boardType === 'weekly' ? 'active' : ''}`}
          >
            Weekly Competition
          </button>
          <button
            onClick={() => setBoardType('alltime')}
            className={`leaderboard-tab-btn ${boardType === 'alltime' ? 'active' : ''}`}
          >
            All-Time Ranks
          </button>
        </div>
      </div>

      {/* Top 3 Podium Highlights */}
      <div className="podium-row">
        {/* Rank 2 (Left) */}
        {currentBoardData[1] && (
          <div className="podium-pillar rank-2">
            <span className="podium-rank">2</span>
            <div className="podium-avatar">🥈</div>
            <div className="podium-name">{currentBoardData[1].username}</div>
            <div className="podium-xp">{currentBoardData[1].xp} XP</div>
            <div className="podium-level">Lvl {currentBoardData[1].level}</div>
          </div>
        )}

        {/* Rank 1 (Center) */}
        {currentBoardData[0] && (
          <div className="podium-pillar rank-1">
            <span className="podium-rank">1</span>
            <div className="podium-avatar">👑</div>
            <div className="podium-name">{currentBoardData[0].username}</div>
            <div className="podium-xp">{currentBoardData[0].xp} XP</div>
            <div className="podium-level">Lvl {currentBoardData[0].level}</div>
          </div>
        )}

        {/* Rank 3 (Right) */}
        {currentBoardData[2] && (
          <div className="podium-pillar rank-3">
            <span className="podium-rank">3</span>
            <div className="podium-avatar">🥉</div>
            <div className="podium-name">{currentBoardData[2].username}</div>
            <div className="podium-xp">{currentBoardData[2].xp} XP</div>
            <div className="podium-level">Lvl {currentBoardData[2].level}</div>
          </div>
        )}
      </div>

      {/* Rankings List Card */}
      <Card glass className="leaderboard-table-card">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
              <th>Username</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Level</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Total XP</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Gold Coins</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {currentBoardData.map((user) => (
              <tr 
                key={user.rank}
                className={`leaderboard-row-tr ${user.isCurrentUser ? 'current-user-highlight' : ''}`}
              >
                <td style={{ textAlign: 'center' }}>
                  <span className={`rank-number-badge r-${user.rank}`}>
                    {user.rank}
                  </span>
                </td>
                <td style={{ fontWeight: user.isCurrentUser ? 750 : 500 }}>
                  {user.username}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className="table-level-badge">Lvl {user.level}</span>
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {user.xp.toLocaleString()} XP
                </td>
                <td style={{ textAlign: 'right', color: '#ffc857' }}>
                  🪙 {user.coins}
                </td>
                <td style={{ textAlign: 'right', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  {user.accuracy}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Current User Floating Standing summary */}
      {userRankInfo && (
        <div className="user-standing-summary">
          <span style={{ fontSize: '18px' }}>⚡</span>
          <span>Your Standing: You are currently ranked <strong>#{userRankInfo.rank}</strong> in the {boardType === 'weekly' ? 'Weekly Competition' : 'All-Time board'}. Complete academy lessons or practice sessions to climb!</span>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
