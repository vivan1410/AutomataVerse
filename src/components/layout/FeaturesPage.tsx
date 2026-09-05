import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AppTab } from '../../App';
import {
  AcademyIcon,
  PlayIcon,
  CodeIcon,
  HelpIcon,
  TrophyIcon,
  DashboardIcon,
} from '../ui/Icon';

interface FeaturesPageProps {
  onEnterApp: () => void;
  setActiveTab: (tab: AppTab) => void;
  onNavigateToLanding: () => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({
  onEnterApp,
  setActiveTab,
  onNavigateToLanding,
}) => {
  const handleFeatureClick = (featId: string, targetTab: AppTab) => {
    // 1. Establish scroll target session storage
    if (featId === 'animation') sessionStorage.setItem('av_nav_scroll_target', 'animation');
    else if (featId === 'simulation') sessionStorage.setItem('av_nav_scroll_target', 'simulator');
    else if (featId === 'build') sessionStorage.setItem('av_nav_scroll_target', 'builder');
    else if (featId === 'challenges') sessionStorage.setItem('av_nav_scroll_target', 'challenges');
    else if (featId === 'tracking') sessionStorage.setItem('av_nav_scroll_target', 'statistics');

    // 2. Set mock login
    localStorage.setItem('isLoggedIn', 'true');

    // 3. Mount dashboard workspace
    onEnterApp();

    // 4. Set active tab
    setActiveTab(targetTab);

    // 5. Scroll layout deferred
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
    }, 450);
  };

  const featureList = [
    {
      id: 'animation',
      title: 'Learn by Animation',
      description: 'Watch DFA state transitions animate step-by-step.',
      btnLabel: 'Open DFA Academy',
      targetTab: 'dfa-academy' as AppTab,
      icon: <AcademyIcon size={18} color="var(--accent-cyan)" />,
    },
    {
      id: 'simulation',
      title: 'Interactive Simulations',
      description: 'Debug DFA and NFA logic instantly. Inspect validation traces.',
      btnLabel: 'Open DFA Simulator',
      targetTab: 'dfa-academy' as AppTab,
      icon: <PlayIcon size={18} color="var(--accent-purple)" />,
    },
    {
      id: 'build',
      title: 'Build Your Own Automata',
      description: 'Draw nodes and link edges with floating canvas tools.',
      btnLabel: 'Open Automata Builder',
      targetTab: 'dfa-academy' as AppTab,
      icon: <CodeIcon size={18} color="var(--accent-cyan)" />,
    },
    {
      id: 'tutor',
      title: 'AI Automata Tutor',
      description: 'Get automated feedback on machine diagrams. Receive hints.',
      btnLabel: 'Open AI Tutor',
      targetTab: 'ai-tutor' as AppTab,
      icon: <HelpIcon size={18} color="var(--accent-purple)" />,
    },
    {
      id: 'challenges',
      title: 'Challenges Hub',
      description: 'Solve timed questions, practice arena, and constructor drills.',
      btnLabel: 'Open Challenges',
      targetTab: 'challenges' as AppTab,
      icon: <TrophyIcon size={18} color="var(--accent-cyan)" />,
    },
    {
      id: 'tracking',
      title: 'Progress Tracking',
      description: 'View dashboard waves, state coverage graphs, and compute histories.',
      btnLabel: 'Open Profile',
      targetTab: 'profile' as AppTab,
      icon: <DashboardIcon size={18} color="var(--accent-purple)" />,
    },
  ];

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-app)',
      padding: '40px 20px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '960px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={onNavigateToLanding}>
          <span style={{ fontSize: '24px' }}>⚡</span>
          <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>AutomataVerse</span>
        </div>
        <Button variant="outline" size="sm" onClick={onNavigateToLanding}>
          ← Back to Home
        </Button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '48px', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 900, color: '#fff', marginBottom: '12px' }}>Explore AutomataVerse</h1>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', lineHeight: 1.5 }}>Discover every tool available inside AutomataVerse.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        width: '100%',
        maxWidth: '960px',
      }}>
        {featureList.map((feat) => (
          <Card 
            key={feat.id} 
            glass 
            interactive 
            glow
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between', 
              minHeight: '200px', 
              padding: '24px',
              textAlign: 'left'
            }}
          >
            <div>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                {feat.icon}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>{feat.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>{feat.description}</p>
            </div>
            <Button 
              variant="primary" 
              size="sm" 
              glow 
              onClick={() => handleFeatureClick(feat.id, feat.targetTab)}
              style={{ width: '100%', padding: '8px' }}
            >
              {feat.btnLabel}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};
export default FeaturesPage;
