import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Workspace from './components/layout/Workspace';
import CommandPalette from './components/ui/CommandPalette';
import AnimatedBackground from './components/ui/AnimatedBackground';
import LandingPage from './components/layout/LandingPage';
import LoginPage from './components/layout/LoginPage';
import RegisterPage from './components/layout/RegisterPage';
import FeaturesPage from './components/layout/FeaturesPage';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { apiService } from './services/api';
import { progressManager } from './services/progressManager';

export interface CanvasSettings {
  gridVisible: boolean;
  gridSnap: boolean;
  zoomLevel: number;
}

export type AppTab = 'canvas' | 'home' | 'profile' | 'achievements' | 'challenges' | 'settings' | 'dfa-academy' | 'nfa-academy' | 'converter' | 'variables' | 'activity' | 'ai-tutor' | 'api-test';

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
  achievements?: string[];
  questionsSolvedCount?: number;
  correctAnswersCount?: number;
  totalAnswersCount?: number;
}

export type EntryScreen = 'LANDING' | 'FEATURES' | 'LOGIN' | 'REGISTER' | 'DASHBOARD';

const App: React.FC = () => {
  const [entryScreen, setEntryScreen] = useState<EntryScreen>(() => {
    if (typeof window !== 'undefined') {
      const logged = localStorage.getItem('isLoggedIn') === 'true';
      return logged ? 'DASHBOARD' : 'LANDING';
    }
    return 'LANDING';
  });
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'system'>(() => {
    return (localStorage.getItem('av_settings_theme_mode') as any) || 'dark';
  });
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>({
    gridVisible: true,
    gridSnap: true,
    zoomLevel: 100,
  });

  const VALID_TABS: AppTab[] = ['canvas', 'home', 'profile', 'achievements', 'challenges', 'settings', 'dfa-academy', 'nfa-academy', 'converter', 'variables', 'activity', 'ai-tutor', 'api-test'];

  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Verify backend server health check on startup
  useEffect(() => {
    let active = true;
    const testConnection = async () => {
      try {
        const result = await apiService.checkHealth();
        if (result.success && active) {
          setBackendStatus('connected');
        } else if (active) {
          setBackendStatus('error');
        }
      } catch (err) {
        if (active) {
          setBackendStatus('error');
        }
      }
    };
    testConnection();
    // Periodically poll health check (every 15 seconds) to handle server reconnects dynamically
    const interval = setInterval(testConnection, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);
  // Protect dashboard routes and redirect unauthorized guests
  useEffect(() => {
    const logged = localStorage.getItem('isLoggedIn') === 'true';
    if (entryScreen === 'DASHBOARD' && !logged) {
      setEntryScreen('LOGIN');
    }
  }, [entryScreen]);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  const changeTab = (tab: AppTab) => {
    if (VALID_TABS.includes(tab)) {
      setIsNavigating(true);
      setTimeout(() => {
        setActiveTab(tab);
        setIsNavigating(false);
      }, 250);
    } else {
      console.warn(`[AutomataVerse Navigator] Attempted transition to undefined target tab: "${tab}". Defaulting to home.`);
      setActiveTab('home');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('av_user_email');
    setEntryScreen('LOGIN');
    setActiveTab('home');
  };

  const [profile, setProfile] = useState<UserProfile>(() => {
    return {
      xp: 0,
      coins: 0,
      level: 1,
      streak: 0,
      lastActiveDate: '',
      username: 'Student Learner',
      email: 'guest@automataverse.io',
      avatar: '🧙‍♂️ Wizard',
      joinDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      totalTimeSpent: 0,
      questionsSolved: 0,
      practiceSessions: 0,
      challengeSessions: 0,
      bestAccuracy: 0,
      longestStreak: 0,
      lessonsCompleted: [],
      chaptersCompleted: [],
      quizzesCompleted: [],
      challengesSolved: [],
      achievements: []
    };
  });

  const [previousLevel, setPreviousLevel] = useState<number>(1);
  const [showDailyLoginModal, setShowDailyLoginModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [coinParticles, setCoinParticles] = useState<{ id: number; left: string; bottom: string; targetX: string; targetY: string }[]>([]);

  // Sync profile from backend on mount or tab change
  useEffect(() => {
    const logged = localStorage.getItem('isLoggedIn') === 'true';
    const email = localStorage.getItem('av_user_email') || 'guest@automataverse.io';
    
    if (logged) {
      progressManager.syncProfile(email, setProfile).then((prof) => {
        if (prof) {
          // Perform check-in on backend
          progressManager.dailyCheckin(email, setProfile).then((updatedProf) => {
            if (updatedProf && updatedProf.streak > profile.streak && profile.streak > 0) {
              setShowDailyLoginModal(true);
            }
          });
        }
      });
    }
  }, [entryScreen]);

  // Automatic Level Progression & Bonus Rewards (No Modal or Popup)
  useEffect(() => {
    if (profile.level > previousLevel) {
      const levelDiff = profile.level - previousLevel;
      setPreviousLevel(profile.level);
      // Award level-up bonus coins (+50 per level) automatically without any popup
      setProfile((prev) => ({ ...prev, coins: prev.coins + (50 * levelDiff) }));
    } else {
      setPreviousLevel(profile.level);
    }
  }, [profile.level, previousLevel]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const triggerCoinAnimation = () => {
    const nextParticles = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      left: `${45 + Math.random() * 10}vw`,
      bottom: `${15 + Math.random() * 10}vh`,
      targetX: `${25 + Math.random() * 10}vw`,
      targetY: `-${60 + Math.random() * 10}vh`
    }));
    setCoinParticles(nextParticles);
    setTimeout(() => setCoinParticles([]), 1250);
  };

  // Secure Server-Authoritative Reward Trigger (Requirement 6)
  const awardRewards = async (type: 'lesson' | 'quiz' | 'challenge' | 'achievement', id: string, extra?: any) => {
    const email = profile.email || localStorage.getItem('av_user_email') || 'guest@automataverse.io';
    if (type === 'lesson') {
      await progressManager.completeLesson(email, id, setProfile, showToast);
    } else if (type === 'quiz') {
      const { isCorrect, difficulty } = extra || {};
      await progressManager.submitQuizAnswer(email, id, isCorrect, difficulty, setProfile, showToast);
      if (isCorrect) triggerCoinAnimation();
    } else if (type === 'challenge') {
      const difficulty = extra || 'Medium';
      await progressManager.completeChallenge(email, id, difficulty, setProfile, showToast);
      triggerCoinAnimation();
    } else if (type === 'achievement') {
      const { bonusCoins, bonusXp } = extra || {};
      await progressManager.claimAchievement(email, id, bonusCoins, bonusXp, setProfile, showToast);
      triggerCoinAnimation();
    }
  };

  const updateProfile = async (updatedDetails: Partial<UserProfile>) => {
    const email = profile.email || localStorage.getItem('av_user_email') || 'guest@automataverse.io';
    if (updatedDetails.username || updatedDetails.avatar) {
      await progressManager.updateDetails(email, updatedDetails.username, updatedDetails.avatar, setProfile);
      showToast('👤 Profile updated successfully!');
    }
  };

  // Sync theme with DOM attribute reactively based on themeMode
  useEffect(() => {
    const applyTheme = () => {
      let activeTheme: 'dark' | 'light' = 'dark';
      if (themeMode === 'system') {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        activeTheme = isSystemDark ? 'dark' : 'light';
      } else {
        activeTheme = themeMode;
      }
      setTheme(activeTheme);
      document.documentElement.setAttribute('data-theme', activeTheme);
      if (activeTheme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
      localStorage.setItem('av_settings_theme_mode', themeMode);
    };

    applyTheme();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themeMode]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette (Cmd + K or Ctrl + K)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      
      // Toggle Sidebar (Cmd + B or Ctrl + B)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }

      // Tab Switching (Cmd + 1..5 or Ctrl + 1..5)
      if (e.metaKey || e.ctrlKey) {
        if (e.key === '1') { e.preventDefault(); changeTab('canvas'); }
        if (e.key === '2') { e.preventDefault(); changeTab('home'); }
        if (e.key === '3') { e.preventDefault(); changeTab('variables'); }
        if (e.key === '4') { e.preventDefault(); changeTab('activity'); }
        if (e.key === '5') { e.preventDefault(); changeTab('settings'); }
      }

      // Close Command Palette with Escape
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    setThemeMode((prev) => {
      let currentActive = prev;
      if (prev === 'system') {
        currentActive = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return currentActive === 'dark' ? 'light' : 'dark';
    });
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const toggleGrid = () => {
    setCanvasSettings((prev) => ({ ...prev, gridVisible: !prev.gridVisible }));
  };

  const toggleSnap = () => {
    setCanvasSettings((prev) => ({ ...prev, gridSnap: !prev.gridSnap }));
  };

  const setZoom = (zoom: number) => {
    setCanvasSettings((prev) => ({ ...prev, zoomLevel: Math.max(25, Math.min(200, zoom)) }));
  };

  if (entryScreen === 'LANDING') {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-app)' }}>
        <AnimatedBackground />
        <LandingPage 
          onNavigateToLogin={() => setEntryScreen('LOGIN')} 
          onNavigateToFeatures={() => setEntryScreen('FEATURES')} 
        />
      </div>
    );
  }

  if (entryScreen === 'FEATURES') {
    return (
      <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
        <AnimatedBackground />
        <FeaturesPage 
          onEnterApp={() => setEntryScreen('DASHBOARD')} 
          setActiveTab={changeTab} 
          onNavigateToLanding={() => setEntryScreen('LANDING')} 
        />
      </div>
    );
  }

  if (entryScreen === 'LOGIN') {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-app)' }}>
        <AnimatedBackground />
        <LoginPage 
          onLoginSuccess={async (email) => {
            setEntryScreen('DASHBOARD');
            const prof = await progressManager.syncProfile(email, setProfile);
            if (prof) {
              await progressManager.dailyCheckin(email, setProfile);
            }
          }} 
          onNavigateToRegister={() => setEntryScreen('REGISTER')} 
          onNavigateToLanding={() => setEntryScreen('LANDING')} 
        />
      </div>
    );
  }

  if (entryScreen === 'REGISTER') {
    return (
      <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-app)' }}>
        <AnimatedBackground />
        <RegisterPage 
          onRegisterSuccess={async (email) => {
            setEntryScreen('DASHBOARD');
            const prof = await progressManager.syncProfile(email, setProfile);
            if (prof) {
              await progressManager.dailyCheckin(email, setProfile);
            }
          }} 
          onNavigateToLogin={() => setEntryScreen('LOGIN')} 
          onNavigateToLanding={() => setEntryScreen('LANDING')} 
        />
      </div>
    );
  }

  console.log("[AutomataVerse App] Rendering. ActiveTab:", activeTab, "Level:", profile.level, "XP:", profile.xp, "Coins:", profile.coins);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-main)',
        position: 'relative',
      }}
    >
      {/* Premium Animated Background Layers */}
      <AnimatedBackground />

      {/* Premium Navigation Loading Overlay */}
      {isNavigating && (
        <div className="tab-navigation-loader-overlay">
          <div className="navigation-spinner-glow" />
          <div className="navigation-loading-text">Loading Workspace...</div>
        </div>
      )}

      <Sidebar
        isOpen={sidebarOpen}
        activeTab={activeTab}
        setActiveTab={changeTab}
        onLogout={handleLogout}
        profile={profile}
      />

      {/* Main Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top Header */}
        <Topbar
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          theme={theme}
          toggleTheme={toggleTheme}
          openCommandPalette={() => setCommandPaletteOpen(true)}
          profile={profile}
          backendStatus={backendStatus}
          onTabChange={changeTab}
        />

        {/* Workspace Canvas / Center Area */}
        <Workspace
          activeTab={activeTab}
          canvasSettings={canvasSettings}
          setZoom={setZoom}
          toggleGrid={toggleGrid}
          toggleSnap={toggleSnap}
          setActiveTab={changeTab}
          awardRewards={awardRewards}
          showToast={showToast}
          profile={profile}
          updateProfile={updateProfile}
          onLogout={handleLogout}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          onToggleSidebar={setSidebarOpen}
        />
      </div>

      {/* Global Raycast-style Command Palette */}
      {commandPaletteOpen && (
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          theme={theme}
          toggleTheme={toggleTheme}
          sidebarOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          canvasSettings={canvasSettings}
          toggleGrid={toggleGrid}
          toggleSnap={toggleSnap}
          setActiveTab={changeTab}
          showLandingPage={handleLogout}
        />
      )}

      {/* Floating Coin Particle Animations */}
      {coinParticles.map((particle) => (
        <div 
          key={particle.id}
          className="coin-particle"
          style={{
            left: particle.left,
            bottom: particle.bottom,
            '--target-x': particle.targetX,
            '--target-y': particle.targetY
          } as React.CSSProperties}
        >
          🪙
        </div>
      ))}

      {/* Toast Achievements Notification Alert */}
      {toastMessage && (
        <div 
          className="toast-slide-in"
          style={{ 
            position: 'fixed', 
            bottom: '24px', 
            right: '24px', 
            zIndex: 10000, 
            background: 'var(--bg-card)', 
            border: '1.5px solid var(--accent-cyan)', 
            padding: '16px 24px', 
            borderRadius: 'var(--radius-md)', 
            color: 'var(--text-main)', 
            fontSize: '13px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            boxShadow: '0 8px 32px var(--shadow)',
            backdropFilter: 'blur(8px)'
          }}
        >
          <span style={{ fontSize: '18px' }}>🏆</span>
          <span style={{ fontWeight: 600 }}>{toastMessage}</span>
        </div>
      )}



      {/* Daily Login Bonus Modal */}
      {showDailyLoginModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(8, 17, 31, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card glass style={{ padding: '40px', maxWidth: '360px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', boxShadow: '0 0 32px var(--accent-purple-glow)' }} className="animate-scale-in">
            <div style={{ fontSize: '44px' }}>📅</div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-warning)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Welcome Back</span>
              <h2 style={{ fontSize: '24px', marginTop: '6px', color: 'var(--text-main)' }}>Daily Login Bonus</h2>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.45 }}>
                Your current streak is <strong>{profile.streak} Days</strong>. Keep learning to maintain your multiplier!
              </p>
            </div>
            <div style={{ padding: '10px 20px', background: 'rgba(255,200,87,0.06)', border: '1.5px solid rgba(255,200,87,0.2)', borderRadius: '6px', fontSize: '13.5px', color: '#FFC857', fontWeight: 700 }}>
              Reward Claimed: 🪙 +20 Coins!
            </div>
            <Button 
              variant="primary" 
              size="md" 
              onClick={() => {
                setShowDailyLoginModal(false);
                setProfile((prev) => ({ ...prev, coins: prev.coins + 20 }));
                triggerCoinAnimation();
              }} 
              glow
            >
              Claim Bonus
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default App;
