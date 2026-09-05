import React from 'react';
import './Home.css';
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
  lessonsCompleted?: string[];
  chaptersCompleted?: number[];
  quizzesCompleted?: string[];
  challengesSolved?: string[];
}

interface HomeProps {
  profile: UserProfile;
  setActiveTab: (tab: AppTab) => void;
}

export const Home: React.FC<HomeProps> = ({ profile, setActiveTab }) => {
  const xpNeeded = profile.level * 500;
  const xpPercentage = Math.round((profile.xp / xpNeeded) * 100);

  const handleFeatureClick = (featId: string, targetTab: AppTab) => {
    if (featId === 'animation') sessionStorage.setItem('av_nav_scroll_target', 'animation');
    else if (featId === 'simulation') sessionStorage.setItem('av_nav_scroll_target', 'simulator');
    else if (featId === 'build') sessionStorage.setItem('av_nav_scroll_target', 'builder');
    else if (featId === 'challenges') sessionStorage.setItem('av_nav_scroll_target', 'challenges');
    else if (featId === 'tracking') sessionStorage.setItem('av_nav_scroll_target', 'statistics');

    setActiveTab(targetTab);

    // Perform deep-link scrolling only after setActiveTab succeeds (deferred via setTimeout)
    setTimeout(() => {
      let elementId = '';
      if (featId === 'animation') elementId = 'animation-simulation-section';
      else if (featId === 'simulation') elementId = 'interactive-simulator-section';
      else if (featId === 'build') elementId = 'automata-builder-section';
      else if (featId === 'tracking') elementId = 'statistics-section';

      if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          element.classList.add('highlight-nav-target');
          setTimeout(() => element.classList.remove('highlight-nav-target'), 2000);
        }
      }
    }, 300);
  };

  const getMilestoneStatus = (id: string) => {
    // Retrieve actual progress from profile
    const dfaCompletedCount = profile.lessonsCompleted ? profile.lessonsCompleted.length : 0;
    const nfaCompletedCount = profile.chaptersCompleted ? profile.chaptersCompleted.length : 0;

    const isStartCompleted = true; // Introduction is completed
    const isDfaUnlocked = true;
    const isDfaCompleted = dfaCompletedCount >= 1;
    
    const isNfaUnlocked = isDfaCompleted;
    const isNfaCompleted = nfaCompletedCount >= 1;

    const isConverterUnlocked = isNfaCompleted;
    const isConverterCompleted = profile.xp > 80;

    const isChallengesUnlocked = isConverterCompleted;
    const isChallengesCompleted = profile.xp > 200;

    const isMasteryUnlocked = isChallengesCompleted;
    const isMasteryCompleted = profile.level >= 2;

    switch (id) {
      case 'start':
        return { unlocked: true, completed: isStartCompleted, active: false };
      case 'dfa':
        return { 
          unlocked: isDfaUnlocked, 
          completed: isDfaCompleted, 
          active: isDfaUnlocked && !isDfaCompleted 
        };
      case 'nfa':
        return { 
          unlocked: isNfaUnlocked, 
          completed: isNfaCompleted, 
          active: isNfaUnlocked && !isNfaCompleted 
        };
      case 'nfa2dfa':
        return { 
          unlocked: isConverterUnlocked, 
          completed: isConverterCompleted, 
          active: isConverterUnlocked && !isConverterCompleted 
        };
      case 'challenges':
        return { 
          unlocked: isChallengesUnlocked, 
          completed: isChallengesCompleted, 
          active: isChallengesUnlocked && !isChallengesCompleted 
        };
      case 'mastery':
        return { 
          unlocked: isMasteryUnlocked, 
          completed: isMasteryCompleted, 
          active: isMasteryUnlocked && !isMasteryCompleted 
        };
      default:
        return { unlocked: false, completed: false, active: false };
    }
  };

  const milestones = [
    { id: 'start', label: 'Start', target: 'dfa-academy', title: '1. Introduction', desc: 'Get familiar with states and strings.' },
    { id: 'dfa', label: 'DFA', target: 'dfa-academy', title: '2. DFA Academy', desc: 'Deterministic state transition loops.' },
    { id: 'nfa', label: 'NFA', target: 'nfa-academy', title: '3. NFA Academy', desc: 'Non-deterministic branching pathways.' },
    { id: 'nfa2dfa', label: 'NFA → DFA', target: 'converter', title: '4. Converter Model', desc: 'Subset construction transition mapping.' },
    { id: 'challenges', label: 'Challenges', target: 'activity', title: '5. Challenge Mode', desc: 'Beat the speed challenge countdown clock.' },
    { id: 'mastery', label: 'Mastery', target: 'profile', title: '6. Mastery Standings', desc: 'Detailed statistics and badge progress.' },
  ];

  const completedMilestones = milestones.filter(m => getMilestoneStatus(m.id).completed);
  const completedCount = completedMilestones.length;
  const progressPercent = milestones.length > 1
    ? Math.max(0, Math.min(100, ((completedCount - 1) / (milestones.length - 1)) * 100))
    : 0;

  const features = [
    {
      id: 'animation',
      title: 'Learn by Animation',
      description: 'Watch state transitions activate and tokens slide step-by-step as you process strings.',
      target: 'dfa-academy' as AppTab,
      icon: '🎓',
      color: 'cyan'
    },
    {
      id: 'simulation',
      title: 'Interactive Simulations',
      description: 'Debug DFA and NFA logic instantly. Jump directly to states and inspect validation traces.',
      target: 'dfa-academy' as AppTab,
      icon: '🏗️',
      color: 'purple'
    },
    {
      id: 'build',
      title: 'Build Your Own Automata',
      description: 'Draw nodes and link edges with floating tools. Drag and place elements with grid snap rules.',
      target: 'dfa-academy' as AppTab,
      icon: '⚛️',
      color: 'success'
    },
    {
      id: 'tutor',
      title: 'AI Tutor Support',
      description: 'Get automated feedback on machine diagrams. Receive hints to solve equivalence assignments.',
      target: 'ai-tutor' as AppTab,
      icon: '🤖',
      color: 'warning'
    },    {
      id: 'challenges',
      title: 'Gamified Challenges',
      description: 'Beat the clock in competitive automata trials. Solve regular expression matching puzzles.',
      target: 'activity' as AppTab,
      icon: '🏆',
      color: 'error'
    },
    {
      id: 'tracking',
      title: 'Progress Tracking',
      description: 'Monitor your accuracy rates, completed lessons count, and achievements milestone badges.',
      target: 'profile' as AppTab,
      icon: '📈',
      color: 'cyan'
    }
  ];

  return (
    <div className="home-dashboard av-tab-transition">
      {/* 1. Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-avatar-large">
          {profile.avatar && profile.avatar.startsWith('http') ? (
            <img 
              src={profile.avatar} 
              alt="Profile Avatar" 
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
            />
          ) : (
            profile.avatar ? profile.avatar.split(' ')[0] : '🧙‍♂️'
          )}
        </div>
        <div className="welcome-text-group">
          <span className="welcome-subtitle">Welcome back, Adventurer</span>
          <h1 className="welcome-title-text">{profile.username || 'Alex Vance'}</h1>
          <p className="welcome-motivational">
            Keep pushing your boundaries. Automata state spaces await your transition rules today!
          </p>
        </div>
        <div className="welcome-stats-badge-row">
          <div className="welcome-badge">
            <span className="badge-icon">🔥</span>
            <div>
              <div className="badge-val">{profile.streak} Days</div>
              <div className="badge-lbl">Active Streak</div>
            </div>
          </div>
          <div className="welcome-badge">
            <span className="badge-icon">🪙</span>
            <div>
              <div className="badge-val">{profile.coins}</div>
              <div className="badge-lbl">Gold Coins</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Grid Layout: Resume Last Session & Recommended Next Lesson */}
      <div className="dashboard-top-grid">
        <Card glass className="session-card">
          <div className="session-header-row">
            <span className="section-mini-tag">CONTINUE LAST SESSION</span>
            <span className="status-dot-green"></span>
          </div>
          <h3 className="session-title">NFA State Space Exploration</h3>
          <p className="session-desc">
            Pick up right where you left off. Continue debugging state transitions on the interactive simulator workspace.
          </p>
          <Button variant="primary" size="sm" onClick={() => setActiveTab('canvas')} glow>
            Launch Simulator
          </Button>
        </Card>

        <Card glass className="session-card">
          <div className="session-header-row">
            <span className="section-mini-tag" style={{ color: 'var(--accent-purple)' }}>RECOMMENDED NEXT LESSON</span>
            <span className="status-dot-purple"></span>
          </div>
          <h3 className="session-title">Transition Mappings & Alphabets</h3>
          <p className="session-desc">
            Deepen your conceptual mastery. Learn how formal languages process alphabet symbols and drive state transitions.
          </p>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('dfa-academy')}>
            Start Lesson
          </Button>
        </Card>
      </div>

      {/* 3. Learning Journey Milestones Timeline */}
      <div className="learning-journey-section">
        <h2 className="section-headline">Learning Journey</h2>
        <Card glass className="timeline-journey-card">
          <div 
            className="journey-track-line"
            style={{
              background: `linear-gradient(to right, var(--timeline-active) 0%, var(--timeline-active) ${progressPercent}%, var(--timeline-inactive) ${progressPercent}%, var(--timeline-inactive) 100%)`
            }}
          ></div>
          <div className="journey-nodes-row">
            {milestones.map((m) => {
              const status = getMilestoneStatus(m.id);
              return (
                <div 
                  key={m.id} 
                  className={`journey-node-container ${status.completed ? 'completed' : ''} ${status.active ? 'active' : ''} ${!status.unlocked ? 'locked' : ''}`}
                  onClick={() => status.unlocked && setActiveTab(m.target as AppTab)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (status.unlocked) setActiveTab(m.target as AppTab);
                    }
                  }}
                  tabIndex={status.unlocked ? 0 : -1}
                  role="button"
                  aria-label={`${m.label} milestone. ${status.completed ? 'Completed' : ''} ${status.active ? 'Active' : ''} ${!status.unlocked ? 'Locked' : ''}`}
                >
                  <div className="journey-node-circle">
                    {status.completed ? (
                      <span className="completed-check">✓</span>
                    ) : (
                      <span className="node-initial">
                        {m.id === 'start' && 'S'}
                        {m.id === 'dfa' && 'D'}
                        {m.id === 'nfa' && 'N'}
                        {m.id === 'nfa2dfa' && '⇄'}
                        {m.id === 'challenges' && '🏆'}
                        {m.id === 'mastery' && '🎓'}
                      </span>
                    )}
                  </div>
                  <div className="journey-node-label">{m.label}</div>
                  
                  {/* Floating tooltip preview details */}
                  <div className="journey-tooltip">
                    <div className="tooltip-title">{m.title}</div>
                    <div className="tooltip-desc">{m.desc}</div>
                    <div className={`tooltip-status ${status.completed ? 'status-comp' : status.active ? 'status-act' : 'status-lock'}`}>
                      {status.completed ? 'Completed' : status.active ? 'Active Step' : 'Locked'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 4. Supercharge Your Learning Features Grid */}
      <div className="supercharge-learning-section">
        <h2 className="section-headline">Supercharge Your Learning</h2>
        <div className="features-showcase-grid">
          {features.map((feat) => (
            <div 
              key={feat.id}
              className={`feature-interactive-card glow-${feat.color}`}
              onClick={() => handleFeatureClick(feat.id, feat.target)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleFeatureClick(feat.id, feat.target);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Open ${feat.title} module`}
            >
              <div className="feature-card-header">
                <span className="feature-card-icon">{feat.icon}</span>
                <span className="feature-go-arrow">➜</span>
              </div>
              <h3 className="feature-card-title">{feat.title}</h3>
              <p className="feature-card-desc">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Bottom Metrics Panel: Daily Progress Summary & Recent Activity */}
      <div className="dashboard-metrics-row">
        <Card glass className="metrics-half-card">
          <div className="metrics-header">
            <h3 className="metrics-card-title">Daily Progress Summary</h3>
            <span className="level-badge">Lvl {profile.level}</span>
          </div>
          
          <div className="progress-bar-container">
            <div className="progress-bar-header">
              <span className="progress-bar-label">XP Progress toward next Level</span>
              <span className="progress-bar-percentage">{xpPercentage}%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${xpPercentage}%` }}></div>
            </div>
            <div className="progress-bar-footer-text">
              {profile.xp} / {xpNeeded} XP earned. Earn 500 XP to advance.
            </div>
          </div>

          <div className="mini-stats-grid">
            <div className="mini-stat-item">
              <span className="mini-stat-label">Accuracy Rate</span>
              <span className="mini-stat-val text-cyan">{profile.bestAccuracy || 85}%</span>
            </div>
            <div className="mini-stat-item">
              <span className="mini-stat-label">Longest Streak</span>
              <span className="mini-stat-val text-warning">🔥 {profile.longestStreak || 4} Days</span>
            </div>
            <div className="mini-stat-item">
              <span className="mini-stat-label">Practice Sessions</span>
              <span className="mini-stat-val text-purple">{profile.practiceSessions || 5}</span>
            </div>
          </div>
        </Card>

        <Card glass className="metrics-half-card">
          <h3 className="metrics-card-title">Recent Workspace Activity</h3>
          <div className="activity-timeline">
            {[
              { text: 'Completed DFA Academy: Lesson 1 (DFA Intro)', time: '2 hours ago', icon: '✅' },
              { text: 'Modified local simulator state rules', time: '5 hours ago', icon: '🔧' },
              { text: 'Unlocks Transition Master badge achievement', time: 'Yesterday', icon: '🏆' },
              { text: 'Logged in to continue learning streak', time: 'Yesterday', icon: '📅' }
            ].map((act, idx) => (
              <div key={idx} className="timeline-item">
                <span className="timeline-icon">{act.icon}</span>
                <div className="timeline-info">
                  <span className="timeline-text">{act.text}</span>
                  <span className="timeline-time">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Home;
