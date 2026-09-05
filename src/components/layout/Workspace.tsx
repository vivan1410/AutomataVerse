import React from 'react';
import './Workspace.css';
import { Button } from '../ui/Button';
import { AppTab, CanvasSettings } from '../../App';
import DfaAcademy from './DfaAcademy';
import NfaAcademy from './NfaAcademy';
import NfaSimulator from './NfaSimulator';
import NfaConverter from './NfaConverter';
import { SettingsTab } from './SettingsTab';
import ChallengesSpeedRound from './ChallengesSpeedRound';
import ErrorBoundary from '../ui/ErrorBoundary';
import Home from './Home';
import Profile from './Profile';
import Achievements from './Achievements';
import ChallengesPage from './ChallengesPage';
import AiTutor from './AiTutor';
import ApiTest from './ApiTest';

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

interface WorkspaceProps {
  activeTab: AppTab;
  canvasSettings: CanvasSettings;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  setActiveTab: (tab: AppTab) => void;
  awardRewards?: (type: 'lesson' | 'quiz' | 'challenge' | 'achievement', id: string, extra?: any) => void;
  showToast?: (message: string) => void;
  profile: UserProfile;
  updateProfile: (details: Partial<UserProfile>) => void;
  onLogout?: () => void;
  themeMode: 'dark' | 'light' | 'system';
  setThemeMode: (mode: 'dark' | 'light' | 'system') => void;
  onToggleSidebar?: (open: boolean) => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  activeTab,
  canvasSettings,
  toggleGrid,
  toggleSnap,
  setActiveTab,
  awardRewards,
  showToast,
  profile,
  updateProfile,
  onLogout,
  themeMode,
  setThemeMode,
  onToggleSidebar,
}) => {
  console.log("[AutomataVerse Workspace] Rendering. activeTab:", activeTab);

  return (
    <main className="av-workspace">
      {/* ---------------- CANVAS WORKSPACE TAB ---------------- */}
      {activeTab === 'canvas' && (
        <div className="tab-workspace-view-full av-tab-transition">
          <ErrorBoundary fallbackMessage="The NFA Simulator failed to render.">
            <NfaSimulator onToggleSidebar={onToggleSidebar} />
          </ErrorBoundary>
        </div>
      )}

      {/* ---------------- CONVERTER WORKSPACE TAB ---------------- */}
      {activeTab === 'converter' && (
        <div className="tab-workspace-view-full av-tab-transition">
          <ErrorBoundary fallbackMessage="The NFA to DFA Converter failed to render.">
            <NfaConverter />
          </ErrorBoundary>
        </div>
      )}

      {/* ---------------- HOME DASHBOARD TAB ---------------- */}
      {activeTab === 'home' && (
        <div className="tab-workspace-view av-tab-transition">
          <ErrorBoundary fallbackMessage="The Home dashboard failed to render.">
            <Home profile={profile} setActiveTab={setActiveTab} />
          </ErrorBoundary>
        </div>
      )}

      {/* ---------------- PROFILE TAB ---------------- */}
      {activeTab === 'profile' && (
        <div className="tab-workspace-view av-tab-transition">
          <ErrorBoundary fallbackMessage="The Profile page failed to render.">
            <Profile profile={profile} updateProfile={updateProfile} showToast={showToast} onLogout={onLogout} setActiveTab={setActiveTab} />
          </ErrorBoundary>
        </div>
      )}

      {/* ---------------- ACHIEVEMENTS TAB ---------------- */}
      {activeTab === 'achievements' && (
        <div className="tab-workspace-view av-tab-transition">
          <ErrorBoundary fallbackMessage="The Achievements page failed to render.">
            <Achievements profile={profile} awardRewards={awardRewards} showToast={showToast} />
          </ErrorBoundary>
        </div>
      )}

      {/* ---------------- CHALLENGES TAB ---------------- */}
      {activeTab === 'challenges' && (
        <div className="tab-workspace-view av-tab-transition">
          <ErrorBoundary fallbackMessage="The Challenges page failed to render.">
            <ChallengesPage profile={profile} setActiveTab={setActiveTab} awardRewards={awardRewards} showToast={showToast} />
          </ErrorBoundary>
        </div>
      )}

      {/* ---------------- VARIABLES & LOGIC TAB ---------------- */}
      {activeTab === 'variables' && (
        <div className="tab-workspace-view av-tab-transition">
          <div className="view-header">
            <h1 className="view-title">Variables & State Definitions</h1>
            <p className="view-desc">Configure input alphabets, register variables, and global flags.</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="primary" size="md">
              + New Register Variable
            </Button>
          </div>

          <div className="vars-table-wrapper">
            <table className="vars-table">
              <thead>
                <tr>
                  <th>Variable Name</th>
                  <th>Data Type</th>
                  <th>Default Value</th>
                  <th>Scope</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>SIG_START</td>
                  <td><span className="badge-type">Boolean</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>true</td>
                  <td>Global</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>BUFFER_CAPACITY</td>
                  <td><span className="badge-type">Integer</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>1024</td>
                  <td>Kernel</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>ALPHABET_SYMBOLS</td>
                  <td><span className="badge-type">String[]</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>['0', '1']</td>
                  <td>Automata</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- CHALLENGES TAB ---------------- */}
      {activeTab === 'activity' && (
        <div className="tab-workspace-view-full av-tab-transition">
          <ErrorBoundary 
            fallbackMessage="The Speed Round Results screen crashed. Automatically returning to DFA Academy."
            onReset={() => {
              setActiveTab('dfa-academy');
              showToast?.("Recovered from Speed Round Results crash: returned to Academy.");
            }}
          >
            <ChallengesSpeedRound awardRewards={awardRewards} showToast={showToast} profile={profile} />
          </ErrorBoundary>
        </div>
      )}

      {/* ---------------- SETTINGS TAB ---------------- */}
      {activeTab === 'settings' && (
        <div className="tab-workspace-view av-tab-transition">
          <div className="view-header" style={{ marginBottom: '18px' }}>
            <h1 className="view-title">Workspace Settings</h1>
            <p className="view-desc">Customize desktop preferences, learning settings, and simulator parameters.</p>
          </div>

          <ErrorBoundary fallbackMessage="The Settings panel failed to render.">
            <SettingsTab 
              gridVisible={canvasSettings.gridVisible}
              gridSnap={canvasSettings.gridSnap}
              toggleGrid={toggleGrid}
              toggleSnap={toggleSnap}
              showToast={showToast}
              themeMode={themeMode}
              setThemeMode={setThemeMode}
              profile={profile}
              onLogout={onLogout}
              updateProfile={updateProfile}
            />
          </ErrorBoundary>
        </div>
      )}

      {/* ---------------- DFA ACADEMY TAB ---------------- */}
      {activeTab === 'dfa-academy' && (
        <div className="tab-workspace-view av-tab-transition">
          <ErrorBoundary fallbackMessage="DFA Academy lessons failed to render.">
            <DfaAcademy setActiveTab={setActiveTab} awardRewards={awardRewards} showToast={showToast} />
          </ErrorBoundary>
        </div>
      )}

      {/* ---------------- NFA ACADEMY TAB ---------------- */}
      {activeTab === 'nfa-academy' && (
        <div className="tab-workspace-view av-tab-transition">
          <ErrorBoundary fallbackMessage="NFA Academy lessons failed to render.">
            <NfaAcademy setActiveTab={setActiveTab} awardRewards={awardRewards} showToast={showToast} />
          </ErrorBoundary>
        </div>
      )}
      {/* ---------------- AI TUTOR TAB ---------------- */}
      {activeTab === 'ai-tutor' && (
        <div className="tab-workspace-view-full av-tab-transition">
          <ErrorBoundary fallbackMessage="The AI Tutor Chatbot failed to load.">
            <AiTutor />
          </ErrorBoundary>
        </div>
      )}
      {/* ---------------- DIAGNOSTIC API TEST TAB (HIDDEN ROUTE) ---------------- */}
      {activeTab === 'api-test' && (
        <div className="tab-workspace-view-full av-tab-transition">
          <ErrorBoundary fallbackMessage="The AI API Test Panel failed to load.">
            <ApiTest />
          </ErrorBoundary>
        </div>
      )}
    </main>
  );
};

export default Workspace;
