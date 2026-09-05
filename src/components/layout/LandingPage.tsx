import React, { useState, useEffect } from 'react';
import './LandingPage.css';
import { Button } from '../ui/Button';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToFeatures: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onNavigateToLogin, 
  onNavigateToFeatures 
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 6);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const handleStartLearning = () => {
    setIsExiting(true);
    setTimeout(() => {
      onNavigateToLogin();
    }, 450);
  };

  const handleExploreFeatures = () => {
    setIsExiting(true);
    setTimeout(() => {
      onNavigateToFeatures();
    }, 450);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (typeof window === 'undefined') return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    const offsetX = (clientX / innerWidth) - 0.5;
    const offsetY = (clientY / innerHeight) - 0.5;
    
    setParallaxOffset({
      x: offsetX * 20,
      y: offsetY * 20,
    });
  };

  const nodeA = { x: 90, y: 150 };  // q0
  const nodeB = { x: 240, y: 90 };  // q1
  const nodeC = { x: 310, y: 210 }; // q2

  let activeNode: 'A' | 'B' | 'C' | null = 'A';
  let activePath: 'A-B' | 'B-C' | 'C-A' | null = null;
  let robotPos = nodeA;

  switch (step) {
    case 0:
      activeNode = 'A';
      activePath = null;
      robotPos = nodeA;
      break;
    case 1:
      activeNode = null;
      activePath = 'A-B';
      robotPos = nodeB;
      break;
    case 2:
      activeNode = 'B';
      activePath = null;
      robotPos = nodeB;
      break;
    case 3:
      activeNode = null;
      activePath = 'B-C';
      robotPos = nodeC;
      break;
    case 4:
      activeNode = 'C';
      activePath = null;
      robotPos = nodeC;
      break;
    case 5:
      activeNode = null;
      activePath = 'C-A';
      robotPos = nodeA;
      break;
    default:
      break;
  }

  return (
    <div 
      className={`landing-wrapper ${isExiting ? 'fade-out' : ''}`}
      onMouseMove={handleMouseMove}
    >
      {/* Dynamic Parallax Background Layer */}
      <div 
        className="landing-parallax-bg"
        style={{
          transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`,
        }}
      >
        {/* Animated Connected State Machine Graph */}
        <svg className="landing-bg-states-svg" viewBox="0 0 1000 600" fill="none">
          <defs>
            <linearGradient id="line-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-cyan)" />
              <stop offset="100%" stopColor="var(--accent-purple)" />
            </linearGradient>
            <marker id="arrow-marker" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.15)" />
            </marker>
          </defs>
          
          <path id="path-q0-q1" d="M 180 160 Q 340 100 470 120" stroke="url(#line-grad-1)" strokeWidth="1.5" markerEnd="url(#arrow-marker)" />
          <path id="path-q1-q2" d="M 525 150 Q 720 280 825 425" stroke="url(#line-grad-1)" strokeWidth="1.5" markerEnd="url(#arrow-marker)" />
          <path id="path-q2-q0" d="M 825 450 Q 500 400 178 185" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1.5" strokeDasharray="5 5" markerEnd="url(#arrow-marker)" />

          <circle r="4" fill="var(--accent-cyan)" style={{ filter: 'drop-shadow(0 0 4px var(--accent-cyan))' }}>
            <animateMotion dur="6s" repeatCount="indefinite" path="M 180 160 Q 340 100 470 120" />
          </circle>
          <circle r="4" fill="var(--accent-purple)" style={{ filter: 'drop-shadow(0 0 4px var(--accent-purple))' }}>
            <animateMotion dur="8s" repeatCount="indefinite" path="M 525 150 Q 720 280 825 425" />
          </circle>

          {/* Background State Nodes */}
          <g transform="translate(150, 155)">
            <circle cx="0" cy="0" r="30" fill="var(--bg-card)" stroke="var(--border-medium)" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" fill="var(--text-muted)" fontSize="11" fontWeight="600" fontFamily="var(--font-mono)">q0</text>
          </g>
          <g transform="translate(500, 135)">
            <circle cx="0" cy="0" r="30" fill="var(--bg-card)" stroke="var(--accent-purple)" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 8px var(--accent-purple-glow))' }} />
            <text x="0" y="4" textAnchor="middle" fill="var(--text-main)" fontSize="11" fontWeight="600" fontFamily="var(--font-mono)">q1</text>
          </g>
          <g transform="translate(845, 445)">
            <circle cx="0" cy="0" r="30" fill="var(--bg-card)" stroke="var(--border-medium)" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" fill="var(--text-muted)" fontSize="11" fontWeight="600" fontFamily="var(--font-mono)">q2</text>
          </g>
        </svg>
      </div>

      {/* Main scrolling wrapper */}
      <div className="landing-scroll-container">
        
        {/* HERO SECTION */}
        <div className="hero-section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
          <div className="hero-content-split">
            <div className="hero-text-side">
              <div className="brand-logo-mark" style={{ width: '32px', height: '32px', fontSize: '15px' }}>⚡</div>
              
              <h1 className="hero-title">AutomataVerse</h1>
              <p className="hero-subtitle">
                Master DFA, NFA, and Automata Theory through immersive animations and interactive learning.
              </p>

              <div className="hero-btn-row">
                <Button variant="primary" size="lg" glow onClick={handleStartLearning}>
                  Start Learning
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={handleExploreFeatures}
                >
                  Explore Features
                </Button>
              </div>
            </div>

            <div className="hero-dfa-side">
              <div className="dfa-svg-card">
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live DFA Simulation</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-dimmed)', fontFamily: 'var(--font-mono)' }}>active_state: q{activeNode === 'A' ? '0' : activeNode === 'B' ? '1' : activeNode === 'C' ? '2' : '...'}</span>
                </div>
                
                <svg viewBox="0 0 400 300" width="100%" height="220" style={{ overflow: 'visible' }}>
                  <defs>
                    <marker id="dfa-arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255, 255, 255, 0.25)" />
                    </marker>
                    <marker id="dfa-arrow-glow-cyan" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-cyan)" />
                    </marker>
                    <marker id="dfa-arrow-glow-purple" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-purple)" />
                    </marker>
                  </defs>

                  <path className={`dfa-arrow-line ${activePath === 'A-B' ? 'glowing' : ''}`} d={`M ${nodeA.x} ${nodeA.y} Q 165 95 ${nodeB.x} ${nodeB.y}`} fill="none" markerEnd={activePath === 'A-B' ? "url(#dfa-arrow-glow-cyan)" : "url(#dfa-arrow)"} />
                  <text x="165" y="90" fontSize="10" fontFamily="var(--font-mono)" fill={activePath === 'A-B' ? 'var(--accent-cyan)' : 'var(--text-dimmed)'} textAnchor="middle">a</text>

                  <path className={`dfa-arrow-line ${activePath === 'B-C' ? 'glowing-purple' : ''}`} d={`M ${nodeB.x} ${nodeB.y} Q 285 130 ${nodeC.x} ${nodeC.y}`} fill="none" markerEnd={activePath === 'B-C' ? "url(#dfa-arrow-glow-purple)" : "url(#dfa-arrow)"} />
                  <text x="285" y="125" fontSize="10" fontFamily="var(--font-mono)" fill={activePath === 'B-C' ? 'var(--accent-purple)' : 'var(--text-dimmed)'} textAnchor="middle">b</text>

                  <path className={`dfa-arrow-line ${activePath === 'C-A' ? 'glowing' : ''}`} d={`M ${nodeC.x} ${nodeC.y} Q 185 220 ${nodeA.x} ${nodeA.y}`} fill="none" markerEnd={activePath === 'C-A' ? "url(#dfa-arrow-glow-cyan)" : "url(#dfa-arrow)"} />
                  <text x="185" y="235" fontSize="10" fontFamily="var(--font-mono)" fill={activePath === 'C-A' ? 'var(--accent-cyan)' : 'var(--text-dimmed)'} textAnchor="middle">c</text>

                  <path className="dfa-arrow-line" d="M 70 135 C 40 100, 110 90, 85 130" fill="none" markerEnd="url(#dfa-arrow)" />
                  <text x="70" y="80" fontSize="10" fontFamily="var(--font-mono)" fill="var(--text-dimmed)" textAnchor="middle">0</text>

                  <g transform={`translate(${nodeA.x}, ${nodeA.y})`} className={activeNode === 'A' ? 'active' : ''}>
                    <circle cx="0" cy="0" r="22" className="dfa-node-circle" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="1.5" />
                    <text x="0" y="4" textAnchor="middle" className="dfa-node-text">q0</text>
                  </g>
                  
                  <g transform={`translate(${nodeB.x}, ${nodeB.y})`} className={activeNode === 'B' ? 'active-purple' : ''}>
                    <circle cx="0" cy="0" r="22" className="dfa-node-circle" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="1.5" />
                    <text x="0" y="4" textAnchor="middle" className="dfa-node-text">q1</text>
                  </g>

                  <g transform={`translate(${nodeC.x}, ${nodeC.y})`} className={activeNode === 'C' ? 'active' : ''}>
                    <circle cx="0" cy="0" r="22" className="dfa-node-circle" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="18" fill="none" stroke="var(--border-medium)" strokeWidth="1" />
                    <text x="0" y="4" textAnchor="middle" className="dfa-node-text">q2</text>
                  </g>

                  <g className="dfa-robot-node" style={{ transform: `translate(${robotPos.x}px, ${robotPos.y}px)` }}>
                    <circle cx="0" cy="0" r="13" fill="var(--bg-app)" stroke={activePath ? "var(--accent-cyan)" : "var(--accent-purple)"} strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 4px rgba(61,235,255,0.4))' }} />
                    <rect x="-6" y="-6" width="12" height="10" rx="2" fill="var(--bg-card)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    <circle cx="-2.5" cy="-2" r="1" fill="var(--accent-cyan)" />
                    <circle cx="2.5" cy="-2" r="1" fill="var(--accent-cyan)" />
                    <line x1="0" y1="-6" x2="0" y2="-9" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                    <circle cx="0" cy="-10" r="1.5" fill="var(--accent-purple)" />
                  </g>
                </svg>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-success)', animation: 'pulseGlow 2s infinite' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {activePath === 'A-B' && 'Traversing edge (a) to state q1...'}
                    {activePath === 'B-C' && 'Traversing edge (b) to accept state q2...'}
                    {activePath === 'C-A' && 'Traversing edge (c) returning to q0...'}
                    {activeNode === 'A' && 'Idle at entry state q0. Awaiting token...'}
                    {activeNode === 'B' && 'State q1 lit. Resolving transition...'}
                    {activeNode === 'C' && 'Success! Accept state q2 activated.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LandingPage;
