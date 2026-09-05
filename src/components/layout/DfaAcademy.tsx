import React, { useState, useEffect } from 'react';
import './DfaAcademy.css';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  AcademyIcon, 
  BoxIcon, 
  SettingsIcon, 
  PlayIcon, 
  CodeIcon, 
  TrophyIcon 
} from '../ui/Icon';
import { LessonCard } from '../ui/LessonCard';

interface DfaAcademyProps {
  setActiveTab: (tab: any) => void;
  awardRewards?: (type: 'lesson' | 'quiz' | 'challenge' | 'achievement', id: string, extra?: any) => void;
  showToast?: (message: string) => void;
}

interface AnalyticsData {
  streak: number;
  correctAnswers: number;
  incorrectAnswers: number;
  completionTimes: { [lessonId: number]: number }; // seconds elapsed
  lastActiveDate: string;
}

// -------------------------------------------------------------
// FIRST INTERACTIVE LESSON: What is a DFA?
// -------------------------------------------------------------
const LessonOneInteractive: React.FC<{ setActiveTab: (tab: any) => void }> = ({ setActiveTab }) => {
  const [simStep, setSimStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setSimStep((prev) => {
        if (prev >= 6) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2200);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleReplay = () => {
    setSimStep(0);
    setIsPlaying(true);
  };

  const node0 = { x: 70, y: 80 };
  const node1 = { x: 200, y: 80 };
  const node2 = { x: 330, y: 80 };

  let activeState: 'q0' | 'q1' | 'q2' | null = 'q0';
  let activePath: 'q0-q1' | 'q1-q2' | 'q2-q0' | null = null;
  let robotPos = node0;

  switch (simStep) {
    case 0:
      activeState = 'q0';
      activePath = null;
      robotPos = node0;
      break;
    case 1:
      activeState = null;
      activePath = 'q0-q1';
      robotPos = node1;
      break;
    case 2:
      activeState = 'q1';
      activePath = null;
      robotPos = node1;
      break;
    case 3:
      activeState = null;
      activePath = 'q1-q2';
      robotPos = node2;
      break;
    case 4:
      activeState = 'q2';
      activePath = null;
      robotPos = node2;
      break;
    case 5:
      activeState = null;
      activePath = 'q2-q0';
      robotPos = node0;
      break;
    case 6:
      activeState = 'q0';
      activePath = null;
      robotPos = node0;
      break;
    default:
      break;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <Card glass style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>1. Finite States</div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
            Resides in exactly one "state" at any point, representing the computational memory.
          </p>
        </Card>
        <Card glass style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>2. Deterministic</div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
            Every input symbol triggers exactly one transition. No ambiguity or choice.
          </p>
        </Card>
        <Card glass style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-warning)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>3. Accept Conditions</div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
            If the computation finishes in a double-circle Accept State, the string is valid.
          </p>
        </Card>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dimmed)', letterSpacing: '0.05em' }}>Input String: </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, marginLeft: '6px' }}>
              <span style={{ color: (simStep === 0 || simStep === 1) ? 'var(--accent-cyan)' : 'var(--text-muted)', background: (simStep === 0 || simStep === 1) ? 'rgba(61,235,255,0.08)' : 'transparent', padding: '2px 6px', borderRadius: '3px' }}>1</span>
              <span style={{ color: (simStep === 2 || simStep === 3) ? 'var(--accent-purple)' : 'var(--text-muted)', background: (simStep === 2 || simStep === 3) ? 'rgba(123,97,255,0.08)' : 'transparent', padding: '2px 6px', borderRadius: '3px' }}>0</span>
              <span style={{ color: (simStep === 4 || simStep === 5) ? 'var(--accent-cyan)' : 'var(--text-muted)', background: (simStep === 4 || simStep === 5) ? 'rgba(61,235,255,0.08)' : 'transparent', padding: '2px 6px', borderRadius: '3px' }}>1</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" onClick={handleReplay}>
              Replay Simulation
            </Button>
          </div>
        </div>

        <svg viewBox="0 0 400 180" width="100%" height="150" style={{ overflow: 'visible' }}>
          <defs>
            <marker id="arrow-glow-cyan" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-cyan)" />
            </marker>
            <marker id="arrow-glow-purple" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-purple)" />
            </marker>
            <marker id="arrow-standard" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--graph-arrow)" />
            </marker>
            <marker id="arrow-start" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--graph-start-arrow)" />
            </marker>
          </defs>

          {/* Start Arrow */}
          <path d="M 45 70 L 78 70" stroke="var(--graph-start-arrow)" strokeWidth="2" fill="none" markerEnd="url(#arrow-start)" />
          <text x="55" y="62" fontSize="10" fontFamily="var(--font-mono)" fill="var(--text-muted)" textAnchor="middle" fontWeight="bold">Start</text>

          {/* Transition Paths */}
          <path className={`dfa-arrow-line ${activePath === 'q0-q1' ? 'glowing' : ''}`} d="M 120 70 L 178 70" fill="none" markerEnd={activePath === 'q0-q1' ? "url(#arrow-glow-cyan)" : "url(#arrow-standard)"} />
          <text x="150" y="54" fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold" fill={activePath === 'q0-q1' ? 'var(--accent-cyan)' : 'var(--graph-label-text)'} stroke="var(--graph-label-bg)" strokeWidth="4" paintOrder="stroke" textAnchor="middle">1</text>

          <path className={`dfa-arrow-line ${activePath === 'q1-q2' ? 'glowing-purple' : ''}`} d="M 220 70 L 278 70" fill="none" markerEnd={activePath === 'q1-q2' ? "url(#arrow-glow-purple)" : "url(#arrow-standard)"} />
          <text x="250" y="54" fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold" fill={activePath === 'q1-q2' ? 'var(--accent-purple)' : 'var(--graph-label-text)'} stroke="var(--graph-label-bg)" strokeWidth="4" paintOrder="stroke" textAnchor="middle">0</text>

          <path className={`dfa-arrow-line ${activePath === 'q2-q0' ? 'glowing' : ''}`} d="M 290 87 Q 200 155 110 87" fill="none" markerEnd={activePath === 'q2-q0' ? "url(#arrow-glow-cyan)" : "url(#arrow-standard)"} />
          <text x="200" y="165" fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold" fill={activePath === 'q2-q0' ? 'var(--accent-cyan)' : 'var(--graph-label-text)'} stroke="var(--graph-label-bg)" strokeWidth="4" paintOrder="stroke" textAnchor="middle">1</text>

          {/* State Circles & Labels */}
          <g transform={`translate(${node0.x}, ${node0.y})`} className={activeState === 'q0' ? 'active' : ''}>
            <circle cx="0" cy="0" r="20" className="dfa-node-circle" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" fill="var(--text-main)" fontWeight="bold" className="dfa-node-text">q0</text>
          </g>
          <g transform={`translate(${node1.x}, ${node1.y})`} className={activeState === 'q1' ? 'active-purple' : ''}>
            <circle cx="0" cy="0" r="20" className="dfa-node-circle" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" fill="var(--text-main)" fontWeight="bold" className="dfa-node-text">q1</text>
          </g>
          <g transform={`translate(${node2.x}, ${node2.y})`} className={activeState === 'q2' ? 'active' : ''}>
            <circle cx="0" cy="0" r="20" className="dfa-node-circle" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="16" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" fill="var(--text-main)" fontWeight="bold" className="dfa-node-text">q2</text>
          </g>

          <g className="dfa-robot-node" style={{ transform: `translate(${robotPos.x}px, ${robotPos.y}px)`, transition: 'transform 1.1s cubic-bezier(0.25, 1, 0.5, 1)' }}>
            <circle cx="0" cy="0" r="12" fill="var(--bg-app)" stroke={activePath ? "var(--accent-cyan)" : "var(--accent-purple)"} strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 4px rgba(61,235,255,0.4))' }} />
            <rect x="-5" y="-5" width="10" height="9" rx="1.5" fill="var(--bg-card)" stroke="var(--border-medium)" strokeWidth="1" />
            <circle cx="-2" cy="-1.5" r="0.8" fill="var(--accent-cyan)" />
            <circle cx="2" cy="-1.5" r="0.8" fill="var(--accent-cyan)" />
            <line x1="0" y1="-5" x2="0" y2="-7" stroke="var(--border-medium)" strokeWidth="1" />
            <circle cx="0" cy="-8" r="1" fill="var(--accent-purple)" />
          </g>
        </svg>

        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isPlaying ? 'var(--accent-cyan)' : 'var(--text-dimmed)', animation: isPlaying ? 'pulseGlow 2s infinite' : 'none' }} />
          <span style={{ fontSize: '12.5px', color: 'var(--text-main)', fontWeight: 500 }}>
            {simStep === 0 && 'Machine initialized at start state q0. Processing string 101...'}
            {simStep === 1 && 'Reading input symbol "1". Jumper moves to state q1.'}
            {simStep === 2 && 'Arrived at state q1. Transition function delta(q0, 1) = q1 evaluated.'}
            {simStep === 3 && 'Reading input symbol "0". Jumper moves to state q2.'}
            {simStep === 4 && 'Arrived at accept state q2. delta(q1, 0) = q2 evaluated.'}
            {simStep === 5 && 'Reading input symbol "1". Jumper returns along bottom arc to q0.'}
            {simStep === 6 && 'Simulation complete. Machine halted in state q0. Since q0 is NOT an accept state, string 101 is REJECTED.'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(61,235,255,0.02)', border: '1px solid rgba(61,235,255,0.1)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>Want to build finite state systems?</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Open the blank workspace canvas and begin drawing states and transition arrows manually.</p>
        </div>
        <Button variant="outline" size="md" onClick={() => setActiveTab('canvas')}>
          Try It Yourself
        </Button>
      </div>

    </div>
  );
};

// -------------------------------------------------------------
// SECOND INTERACTIVE LESSON: States & Alphabet Drag-Drop game
// -------------------------------------------------------------
interface LessonTwoInteractiveProps {
  onComplete: () => void;
  recordAnswer: (correct: boolean) => void;
}

const LessonTwoInteractive: React.FC<LessonTwoInteractiveProps> = ({ onComplete, recordAnswer }) => {
  const [t1Filled, setT1Filled] = useState(false);
  const [t2Filled, setT2Filled] = useState(false);
  const [dragOverTarget, setDragOverTarget] = useState<'t1' | 't2' | null>(null);
  const [selectedToken, setSelectedToken] = useState<'a' | 'b' | null>(null);
  const [activeStateHover, setActiveStateHover] = useState<'q0' | 'q1' | 'q2' | null>(null);

  useEffect(() => {
    if (t1Filled && t2Filled) {
      onComplete();
    }
  }, [t1Filled, t2Filled]);

  const handleDragStart = (e: React.DragEvent, token: 'a' | 'b') => {
    e.dataTransfer.setData('text/plain', token);
  };

  const handleDrop = (e: React.DragEvent, target: 't1' | 't2') => {
    e.preventDefault();
    setDragOverTarget(null);
    const token = e.dataTransfer.getData('text/plain');
    if (target === 't1') {
      if (token === 'a') {
        setT1Filled(true);
        recordAnswer(true);
      } else {
        recordAnswer(false);
      }
    } else if (target === 't2') {
      if (token === 'b') {
        setT2Filled(true);
        recordAnswer(true);
      } else {
        recordAnswer(false);
      }
    }
  };

  const handleTokenSelect = (token: 'a' | 'b') => {
    setSelectedToken((prev) => (prev === token ? null : token));
  };

  const handleDropzoneClick = (target: 't1' | 't2') => {
    if (target === 't1') {
      if (selectedToken === 'a') {
        setT1Filled(true);
        setSelectedToken(null);
        recordAnswer(true);
      } else if (selectedToken !== null) {
        recordAnswer(false);
      }
    } else if (target === 't2') {
      if (selectedToken === 'b') {
        setT2Filled(true);
        setSelectedToken(null);
        recordAnswer(true);
      } else if (selectedToken !== null) {
        recordAnswer(false);
      }
    }
  };

  const node0 = { x: 70, y: 70 };
  const node1 = { x: 200, y: 70 };
  const node2 = { x: 330, y: 70 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <Card glass style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>States (Q)</div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
            States act as structural checkpoints. Hover over the nodes in the map below to discover their roles.
          </p>
        </Card>
        <Card glass style={{ padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Alphabet (Σ)</div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
            The set of valid input characters (e.g. Σ = {'{a, b}'}). Inputs not in this alphabet are rejected.
          </p>
        </Card>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px', position: 'relative' }}>
        <div style={{ minHeight: '38px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--text-main)', fontWeight: 500 }}>
            {activeStateHover === 'q0' && 'Start State (q0): The single configuration state where the machine starts reading strings.'}
            {activeStateHover === 'q1' && 'Intermediate State (q1): A standard computation node used to process middle characters.'}
            {activeStateHover === 'q2' && 'Accept State (q2): Concentric circles denoting success. Reaching this validates strings.'}
            {!activeStateHover && 'Task: Hover over nodes to inspect states. Drag tokens (a, b) below onto transition empty spots (?).'}
          </span>
        </div>

        <svg viewBox="0 0 400 140" width="100%" height="130" style={{ overflow: 'visible' }}>
          <defs>
            <marker id="arrow-l2" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--graph-arrow)" />
            </marker>
            <marker id="arrow-start-l2" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--graph-start-arrow)" />
            </marker>
          </defs>

          {/* Start Arrow */}
          <path d="M 20 70 L 48 70" stroke="var(--graph-start-arrow)" strokeWidth="2" fill="none" markerEnd="url(#arrow-start-l2)" />
          <text x="32" y="62" fontSize="10" fontFamily="var(--font-mono)" fill="var(--text-muted)" textAnchor="middle" fontWeight="bold">Start</text>

          {/* Transition Paths */}
          <path d="M 90 70 L 178 70" stroke={t1Filled ? 'var(--accent-cyan)' : 'var(--graph-edge)'} strokeWidth="2" fill="none" markerEnd="url(#arrow-l2)" />
          <path d="M 220 70 L 308 70" stroke={t2Filled ? 'var(--accent-purple)' : 'var(--graph-edge)'} strokeWidth="2" fill="none" markerEnd="url(#arrow-l2)" />

          {/* State Circles */}
          <g transform={`translate(${node0.x}, ${node0.y})`} onMouseEnter={() => setActiveStateHover('q0')} onMouseLeave={() => setActiveStateHover(null)} style={{ cursor: 'help' }}>
            <circle cx="0" cy="0" r="20" className="dfa-node-circle active" fill="var(--bg-card)" stroke="var(--accent-cyan)" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" className="dfa-node-text" fill="var(--text-main)" fontWeight="bold">q0</text>
          </g>
          <g transform={`translate(${node1.x}, ${node1.y})`} onMouseEnter={() => setActiveStateHover('q1')} onMouseLeave={() => setActiveStateHover(null)} style={{ cursor: 'help' }}>
            <circle cx="0" cy="0" r="20" className="dfa-node-circle active-purple" fill="var(--bg-card)" stroke="var(--accent-purple)" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" className="dfa-node-text" fill="var(--text-main)" fontWeight="bold">q1</text>
          </g>
          <g transform={`translate(${node2.x}, ${node2.y})`} onMouseEnter={() => setActiveStateHover('q2')} onMouseLeave={() => setActiveStateHover(null)} style={{ cursor: 'help' }}>
            <circle cx="0" cy="0" r="20" className="dfa-node-circle" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="16" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" className="dfa-node-text" fill="var(--text-main)" fontWeight="bold">q2</text>
          </g>

          <foreignObject x="123" y="58" width="24" height="24">
            <div className={`dropzone-circle ${dragOverTarget === 't1' ? 'drag-over' : ''} ${t1Filled ? 'filled-cyan' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragOverTarget('t1'); }} onDragLeave={() => setDragOverTarget(null)} onDrop={(e) => handleDrop(e, 't1')} onClick={() => handleDropzoneClick('t1')}>
              {t1Filled ? 'a' : '?'}
            </div>
          </foreignObject>

          <foreignObject x="253" y="58" width="24" height="24">
            <div className={`dropzone-circle ${dragOverTarget === 't2' ? 'drag-over' : ''} ${t2Filled ? 'filled-purple' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragOverTarget('t2'); }} onDragLeave={() => setDragOverTarget(null)} onDrop={(e) => handleDrop(e, 't2')} onClick={() => handleDropzoneClick('t2')}>
              {t2Filled ? 'b' : '?'}
            </div>
          </foreignObject>
        </svg>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dimmed)', letterSpacing: '0.05em', textAlign: 'center', marginBottom: '8px' }}>Draggable Alphabet tokens</div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="alphabet-token" draggable={!t1Filled} onDragStart={(e) => handleDragStart(e, 'a')} onClick={() => handleTokenSelect('a')} style={{ opacity: t1Filled ? 0.35 : 1, pointerEvents: t1Filled ? 'none' : 'auto', borderWidth: selectedToken === 'a' ? '2.5px' : '1.5px', borderColor: selectedToken === 'a' ? 'var(--accent-cyan)' : 'var(--border-medium)', boxShadow: selectedToken === 'a' ? '0 0 12px var(--accent-cyan-glow)' : 'none' }}>
                a
              </div>
              <div className="alphabet-token" draggable={!t2Filled} onDragStart={(e) => handleDragStart(e, 'b')} onClick={() => handleTokenSelect('b')} style={{ opacity: t2Filled ? 0.35 : 1, pointerEvents: t2Filled ? 'none' : 'auto', color: 'var(--accent-purple)', borderWidth: selectedToken === 'b' ? '2.5px' : '1.5px', borderColor: selectedToken === 'b' ? 'var(--accent-purple)' : 'var(--border-medium)', boxShadow: selectedToken === 'b' ? '0 0 12px var(--accent-purple-glow)' : 'none' }}>
                b
              </div>
            </div>
          </div>
        </div>
      </div>

      {t1Filled && t2Filled && (
        <div style={{ padding: '16px', background: 'rgba(64, 232, 122, 0.04)', border: '1px solid rgba(64, 232, 122, 0.15)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '12px', alignItems: 'center', animation: 'checkReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          <div className="status-indicator-icon completed">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Task Complete! Alphabet assigned.</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>You created the transition path q0 --(a)→ q1 --(b)→ q2 successfully. Click Complete at the bottom to progress!</div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// THIRD INTERACTIVE LESSON: Transition Function Player & Sandbox
// -------------------------------------------------------------
interface LessonThreeInteractiveProps {
  onComplete: () => void;
  recordAnswer: (correct: boolean) => void;
}

const LessonThreeInteractive: React.FC<LessonThreeInteractiveProps> = ({ onComplete, recordAnswer }) => {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualState, setManualState] = useState<'q0' | 'q1'>('q0');
  const [manualPath, setManualPath] = useState<'q0-q1' | 'q1-q0' | 'q0-self' | 'q1-self' | null>(null);

  useEffect(() => {
    if (isManualMode || !isPlaying) return;
    const interval = setInterval(() => {
      setStep((prev) => {
        if (prev >= 4) {
          setIsPlaying(false);
          onComplete();
          return prev;
        }
        return prev + 1;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [isPlaying, isManualMode]);

  const handleNext = () => {
    setIsPlaying(false);
    setStep((prev) => Math.min(4, prev + 1));
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setStep(0);
    setManualState('q0');
    setManualPath(null);
  };

  const handleManualFeed = (symbol: '0' | '1') => {
    setIsPlaying(false);
    let isCorrectTransition = false;
    
    if (manualState === 'q0') {
      if (symbol === '1') {
        setManualPath('q0-q1');
        isCorrectTransition = true;
        setTimeout(() => setManualState('q1'), 1000);
      } else {
        setManualPath('q0-self');
        isCorrectTransition = true; // both alphabet letters valid
        setTimeout(() => setManualPath(null), 1000);
      }
    } else {
      if (symbol === '0') {
        setManualPath('q1-q0');
        isCorrectTransition = true;
        setTimeout(() => setManualState('q0'), 1000);
      } else {
        setManualPath('q1-self');
        isCorrectTransition = true;
        setTimeout(() => setManualPath(null), 1000);
      }
    }
    
    recordAnswer(isCorrectTransition);
  };

  const node0 = { x: 120, y: 80 };
  const node1 = { x: 280, y: 80 };

  let activeState: 'q0' | 'q1' | null = 'q0';
  let activePath: 'q0-q1' | 'q1-q0' | 'q0-self' | 'q1-self' | null = null;
  let robotPos = node0;

  if (isManualMode) {
    activeState = manualState;
    activePath = manualPath;
    robotPos = manualState === 'q0' ? node0 : node1;
  } else {
    switch (step) {
      case 0:
        activeState = 'q0';
        activePath = null;
        robotPos = node0;
        break;
      case 1:
        activeState = null;
        activePath = 'q0-q1';
        robotPos = node1;
        break;
      case 2:
        activeState = null;
        activePath = 'q1-q0';
        robotPos = node0;
        break;
      case 3:
        activeState = null;
        activePath = 'q0-q1';
        robotPos = node1;
        break;
      case 4:
        activeState = 'q1';
        activePath = 'q1-self';
        robotPos = node1;
        break;
      default:
        break;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Operational Mode</div>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-subtle)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
          <Button variant="ghost" size="sm" active={!isManualMode} onClick={() => { setIsManualMode(false); handleReset(); }} style={{ height: '24px', fontSize: '11px', padding: '0 8px' }}>
            Auto String Run
          </Button>
          <Button variant="ghost" size="sm" active={isManualMode} onClick={() => { setIsManualMode(true); handleReset(); }} style={{ height: '24px', fontSize: '11px', padding: '0 8px' }}>
            Manual Sandbox Feed
          </Button>
        </div>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          {!isManualMode ? (
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>Predefined String: </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, marginLeft: '6px', display: 'inline-flex', gap: '2px' }}>
                <span onClick={() => { setIsPlaying(false); setStep(1); }} style={{ cursor: 'pointer', color: (step === 1) ? 'var(--accent-cyan)' : 'var(--text-muted)', background: (step === 1) ? 'rgba(61,235,255,0.08)' : 'transparent', padding: '2px 6px', borderRadius: '3px', transition: 'all 0.2s' }}>1</span>
                <span onClick={() => { setIsPlaying(false); setStep(2); }} style={{ cursor: 'pointer', color: (step === 2) ? 'var(--accent-purple)' : 'var(--text-muted)', background: (step === 2) ? 'rgba(123,97,255,0.08)' : 'transparent', padding: '2px 6px', borderRadius: '3px', transition: 'all 0.2s' }}>0</span>
                <span onClick={() => { setIsPlaying(false); setStep(3); }} style={{ cursor: 'pointer', color: (step === 3) ? 'var(--accent-cyan)' : 'var(--text-muted)', background: (step === 3) ? 'rgba(61,235,255,0.08)' : 'transparent', padding: '2px 6px', borderRadius: '3px', transition: 'all 0.2s' }}>1</span>
                <span onClick={() => { setIsPlaying(false); setStep(4); }} style={{ cursor: 'pointer', color: (step === 4) ? 'var(--accent-purple)' : 'var(--text-muted)', background: (step === 4) ? 'rgba(123,97,255,0.08)' : 'transparent', padding: '2px 6px', borderRadius: '3px', transition: 'all 0.2s' }}>1</span>
              </span>
            </div>
          ) : (
            <div>
              <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interactive Feed Sandbox</span>
            </div>
          )}

          {!isManualMode && (
            <div style={{ display: 'flex', gap: '4px' }}>
              <Button variant="secondary" size="sm" style={{ padding: '0 8px' }} onClick={handlePrev} disabled={step <= 0}>Prev</Button>
              <Button variant="secondary" size="sm" style={{ padding: '0 8px' }} onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button variant="secondary" size="sm" style={{ padding: '0 8px' }} onClick={handleNext} disabled={step >= 4}>Next</Button>
              <Button variant="secondary" size="sm" style={{ padding: '0 8px' }} onClick={handleReset}>Reset</Button>
            </div>
          )}
        </div>

        <svg viewBox="0 0 400 180" width="100%" height="150" style={{ overflow: 'visible' }}>
          <defs>
            <marker id="arrow-l3" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--graph-arrow)" />
            </marker>
            <marker id="arrow-start-l3" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--graph-start-arrow)" />
            </marker>
          </defs>

          {/* Start Arrow */}
          <path d="M 45 70 L 78 70" stroke="var(--graph-start-arrow)" strokeWidth="2" fill="none" markerEnd="url(#arrow-start-l3)" />
          <text x="55" y="62" fontSize="10" fontFamily="var(--font-mono)" fill="var(--text-muted)" textAnchor="middle" fontWeight="bold">Start</text>

          {/* Bidirectional & Self Loop Transitions */}
          <path className={`dfa-arrow-line ${activePath === 'q0-q1' ? 'animating' : ''}`} d="M 116 60 Q 200 40 282 60" fill="none" markerEnd="url(#arrow-l3)" />
          <text x="200" y="32" fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold" fill={activePath === 'q0-q1' ? 'var(--accent-cyan)' : 'var(--graph-label-text)'} stroke="var(--graph-label-bg)" strokeWidth="4" paintOrder="stroke" textAnchor="middle">1</text>

          <path className={`dfa-arrow-line ${activePath === 'q1-q0' ? 'animating-purple' : ''}`} d="M 284 80 Q 200 120 118 80" fill="none" markerEnd="url(#arrow-l3)" />
          <text x="200" y="136" fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold" fill={activePath === 'q1-q0' ? 'var(--accent-purple)' : 'var(--graph-label-text)'} stroke="var(--graph-label-bg)" strokeWidth="4" paintOrder="stroke" textAnchor="middle">0</text>

          <path className={`dfa-arrow-line ${activePath === 'q0-self' ? 'animating' : ''}`} d="M 86 58 C 45 35, 45 105, 86 82" fill="none" markerEnd="url(#arrow-l3)" />
          <text x="40" y="74" fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold" fill={activePath === 'q0-self' ? 'var(--accent-cyan)' : 'var(--graph-label-text)'} stroke="var(--graph-label-bg)" strokeWidth="4" paintOrder="stroke" textAnchor="middle">0</text>

          <path className={`dfa-arrow-line ${activePath === 'q1-self' ? 'animating-purple' : ''}`} d="M 314 58 C 355 35, 355 105, 314 82" fill="none" markerEnd="url(#arrow-l3)" />
          <text x="360" y="74" fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold" fill={activePath === 'q1-self' ? 'var(--accent-purple)' : 'var(--graph-label-text)'} stroke="var(--graph-label-bg)" strokeWidth="4" paintOrder="stroke" textAnchor="middle">1</text>

          {/* State Circles & Labels */}
          <g transform={`translate(${node0.x}, ${node0.y})`} className={activeState === 'q0' ? 'active' : ''}>
            <circle cx="0" cy="0" r="20" className="dfa-node-circle" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" fill="var(--text-main)" fontWeight="bold" className="dfa-node-text">q0</text>
          </g>
          <g transform={`translate(${node1.x}, ${node1.y})`} className={activeState === 'q1' ? 'active-purple' : ''}>
            <circle cx="0" cy="0" r="20" className="dfa-node-circle" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" fill="var(--text-main)" fontWeight="bold" className="dfa-node-text">q1</text>
          </g>

          <g className="dfa-robot-node" style={{ transform: `translate(${robotPos.x}px, ${robotPos.y}px)`, transition: 'transform 1.0s cubic-bezier(0.25, 1, 0.5, 1)' }}>
            <circle cx="0" cy="0" r="12" fill="var(--bg-app)" stroke={activeState === 'q0' ? "var(--accent-cyan)" : "var(--accent-purple)"} strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 4px rgba(61,235,255,0.4))' }} />
            <rect x="-5" y="-5" width="10" height="9" rx="1.5" fill="var(--bg-card)" stroke="var(--border-medium)" strokeWidth="1" />
            <circle cx="-2" cy="-1.5" r="0.8" fill="var(--accent-cyan)" />
            <circle cx="2" cy="-1.5" r="0.8" fill="var(--accent-cyan)" />
            <line x1="0" y1="-5" x2="0" y2="-7" stroke="var(--border-medium)" strokeWidth="1" />
            <circle cx="0" cy="-8" r="1" fill="var(--accent-purple)" />
          </g>
        </svg>

        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)', animation: 'pulseGlow 2s infinite' }} />
          <span style={{ fontSize: '12.5px', color: 'var(--text-main)', fontWeight: 500 }}>
            {!isManualMode ? (
              <>
                {step === 0 && 'DFA initialized at starting node q0. Predefined string is 1011.'}
                {step === 1 && 'δ(q0, 1) = q1: Reading input "1" moves the robot from state q0 to q1.'}
                {step === 2 && 'δ(q1, 0) = q0: Reading input "0" returns the robot back to state q0.'}
                {step === 3 && 'δ(q0, 1) = q1: Reading input "1" drives the robot back to state q1.'}
                {step === 4 && 'δ(q1, 1) = q1: Reading input "1" triggers the self-loop. Jumper remains in q1.'}
              </>
            ) : (
              <>
                {!manualPath && `Current state is ${manualState}. Feed symbols below to trigger transition rules.`}
                {manualPath === 'q0-q1' && 'Transition δ(q0, 1) = q1 drawing itself...'}
                {manualPath === 'q1-q0' && 'Transition δ(q1, 0) = q0 drawing itself...'}
                {manualPath === 'q0-self' && 'Self loop δ(q0, 0) = q0 drawing itself...'}
                {manualPath === 'q1-self' && 'Self loop δ(q1, 1) = q1 drawing itself...'}
              </>
            )}
          </span>
        </div>
      </div>

      {isManualMode && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <Button variant="outline" size="md" onClick={() => handleManualFeed('0')} disabled={!!manualPath} style={{ width: '120px' }}>
            Trigger "0"
          </Button>
          <Button variant="outline" size="md" onClick={() => handleManualFeed('1')} disabled={!!manualPath} style={{ width: '120px' }}>
            Trigger "1"
          </Button>
          <Button variant="secondary" size="md" onClick={handleReset}>
            Reset
          </Button>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// MAIN DFA ACADEMY PAGE WITH INTEGRATED ANALYTICS
// -------------------------------------------------------------
const LESSONS_DATA = [
  {
    id: 1,
    title: 'Introduction to DFA',
    desc: 'Understand what deterministic finite automata are and see real-world compute examples.',
    time: '5 mins',
    difficulty: 'Beginner',
    iconType: 'academy',
  },
  {
    id: 2,
    title: 'States & Alphabet',
    desc: 'Explore machine states, input characters, transition pathways, and formal alphabets.',
    time: '8 mins',
    difficulty: 'Beginner',
    iconType: 'box',
  },
  {
    id: 3,
    title: 'Transition Function',
    desc: 'Master the formal mapping rules: Q × Σ → Q. Transition tables and graphs revealed.',
    time: '10 mins',
    difficulty: 'Intermediate',
    iconType: 'settings',
  },
  {
    id: 4,
    title: 'Start & Accept States',
    desc: 'Explore token initializations, active computation paths, and accept configurations.',
    time: '6 mins',
    difficulty: 'Beginner',
    iconType: 'play',
    content: `DFAs evaluate whether string inputs are valid or invalid using designated start and end states:

• Start State (q0): The single state where computation begins when the string is fed. Visualized with an incoming arrow from nowhere.
• Accept States (F): A subset of Q containing states that declare successful validation. If the machine ends up in an accept state after reading the entire string, the string is accepted. Visualized with double concentric circles.`
  },
  {
    id: 5,
    title: 'DFA Simulation',
    desc: 'Process custom strings, execute state transitions, and trace paths step-by-step.',
    time: '12 mins',
    difficulty: 'Advanced',
    iconType: 'code',
    content: `Let's walk through an execution trace. Suppose our DFA accepts strings ending with 'b'.
Alphabet: Σ = {a, b}
States: Q = {q0, q1} where q0 is start and q1 is accept.
Transitions:
• delta(q0, 'a') = q0, delta(q0, 'b') = q1
• delta(q1, 'a') = q0, delta(q1, 'b') = q1

Input: 'ab'
1. Start at q0. Read 'a' -> Transition to q0.
2. Read 'b' -> Transition to q1.
3. String terminates. Current state is q1 (Accept). Input is ACCEPTED!`
  },
  {
    id: 6,
    title: 'Practice Challenge',
    desc: 'Build your own custom DFA that matches regular patterns and validates inputs.',
    time: '15 mins',
    difficulty: 'Advanced',
    iconType: 'trophy',
    content: `Challenge Goal: Design a DFA over Σ = {a, b} that accepts strings containing the substring 'ab'.

Try to trace these cases:
• 'ba' -> Starts q0, reads 'b' -> stays q0, reads 'a' -> stays q0. Terminates in q0 (Reject).
• 'aba' -> Starts q0, reads 'a' -> jumps q1, reads 'b' -> jumps q2 (Accept state), reads 'a' -> stays q2. Terminates in q2 (Accept).

Once you've mapped out the state transitions on paper, click complete to graduate DFA Academy!`
  }
];

export const DfaAcademy: React.FC<DfaAcademyProps> = ({ setActiveTab, awardRewards }) => {
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [showDashboard, setShowDashboard] = useState<boolean>(false);
  const [lessonStartTime, setLessonStartTime] = useState<number>(0);

  // Automatically focus the correct lesson/section on navigation from Home
  useEffect(() => {
    const scrollTarget = sessionStorage.getItem('av_nav_scroll_target');
    if (scrollTarget) {
      sessionStorage.removeItem('av_nav_scroll_target');
      if (scrollTarget === 'animation') {
        setActiveLessonId(1);
        setTimeout(() => {
          const element = document.getElementById('animation-simulation-section');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            element.classList.add('highlight-nav-target');
            setTimeout(() => element.classList.remove('highlight-nav-target'), 2000);
          }
        }, 100);
      } else if (scrollTarget === 'simulator') {
        setActiveLessonId(5);
        setTimeout(() => {
          const element = document.getElementById('interactive-simulator-section');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            element.classList.add('highlight-nav-target');
            setTimeout(() => element.classList.remove('highlight-nav-target'), 2000);
          }
        }, 100);
      } else if (scrollTarget === 'builder') {
        setActiveLessonId(6);
        setTimeout(() => {
          const element = document.getElementById('automata-builder-section');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            element.classList.add('highlight-nav-target');
            setTimeout(() => element.classList.remove('highlight-nav-target'), 2000);
          }
        }, 100);
      }
    }
  }, []);

  // Lesson Progress State
  const [progress, setProgress] = useState<{ [key: number]: { completed: boolean; unlocked: boolean } }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('av_dfa_academy_lessons');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const updated = { ...parsed };
          for (let i = 1; i <= 6; i++) {
            if (updated[i]) {
              updated[i].unlocked = true;
            } else {
              updated[i] = { completed: false, unlocked: true };
            }
          }
          return updated;
        } catch (e) {
          console.error('Error loading progress:', e);
        }
      }
    }
    return {
      1: { completed: false, unlocked: true },
      2: { completed: false, unlocked: true },
      3: { completed: false, unlocked: true },
      4: { completed: false, unlocked: true },
      5: { completed: false, unlocked: true },
      6: { completed: false, unlocked: true },
    };
  });

  // Learning Analytics State with LocalStorage persistence
  const [analytics, setAnalytics] = useState<AnalyticsData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('av_dfa_academy_analytics');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Error loading analytics:', e);
        }
      }
    }
    return {
      streak: 1,
      correctAnswers: 3, // Initial correct seeds to prevent division by zero
      incorrectAnswers: 0,
      completionTimes: {},
      lastActiveDate: new Date().toISOString().split('T')[0]
    };
  });

  // Sync states to LocalStorage
  useEffect(() => {
    localStorage.setItem('av_dfa_academy_lessons', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem('av_dfa_academy_analytics', JSON.stringify(analytics));
  }, [analytics]);

  // Handle active streak calibration on mount
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastActive = analytics.lastActiveDate;
    if (lastActive !== todayStr) {
      let newStreak = analytics.streak;
      if (lastActive) {
        const prevDate = new Date(lastActive);
        const todayDate = new Date(todayStr);
        const diffTime = Math.abs(todayDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
      setAnalytics((prev) => ({ ...prev, streak: newStreak, lastActiveDate: todayStr }));
    }
  }, []);

  // Track entry time when user starts a lesson to compute elapsed completion durations
  useEffect(() => {
    if (activeLessonId !== null) {
      setLessonStartTime(Date.now());
    }
  }, [activeLessonId]);

  const recordAnswer = (correct: boolean) => {
    setAnalytics((prev) => ({
      ...prev,
      correctAnswers: prev.correctAnswers + (correct ? 1 : 0),
      incorrectAnswers: prev.incorrectAnswers + (correct ? 0 : 1)
    }));
  };

  const completeLesson = (id: number) => {
    // Check if it was already completed to prevent duplicate rewards!
    const wasCompleted = progress[id]?.completed;

    // Record elapsed time for the completed lesson
    const elapsedSeconds = Math.round((Date.now() - lessonStartTime) / 1000);
    setAnalytics((prev) => {
      const times = { ...prev.completionTimes, [id]: elapsedSeconds };
      return { ...prev, completionTimes: times };
    });

    setProgress((prev) => {
      const current = prev[id] || { completed: false, unlocked: true };
      const nextProgress = {
        ...prev,
        [id]: { ...current, completed: true, unlocked: true },
      };
      
      const nextId = id + 1;
      if (nextId <= 6) {
        const nextNode = prev[nextId] || { completed: false, unlocked: true };
        nextProgress[nextId] = { ...nextNode, unlocked: true };
      }
      
      return nextProgress;
    });

    if (!wasCompleted) {
      // Award lesson completion rewards!
      awardRewards?.('lesson', `dfa_lesson_${id}`);
    }
  };

  const handleNextClick = () => {
    if (activeLessonId === null) return;
    completeLesson(activeLessonId);
    if (activeLessonId < 6) {
      setActiveLessonId(activeLessonId + 1);
    } else {
      setActiveLessonId(null);
    }
  };

  const handlePrevClick = () => {
    if (activeLessonId === null || activeLessonId <= 1) return;
    setActiveLessonId(activeLessonId - 1);
  };

  const resetProgress = () => {
    if (confirm('Are you sure you want to reset your DFA Academy lesson progress and analytics?')) {
      setProgress({
        1: { completed: false, unlocked: true },
        2: { completed: false, unlocked: true },
        3: { completed: false, unlocked: true },
        4: { completed: false, unlocked: true },
        5: { completed: false, unlocked: true },
        6: { completed: false, unlocked: true },
      });
      setAnalytics({
        streak: 1,
        correctAnswers: 3,
        incorrectAnswers: 0,
        completionTimes: {},
        lastActiveDate: new Date().toISOString().split('T')[0]
      });
      setActiveLessonId(null);
      setShowDashboard(false);
    }
  };

  const renderIcon = (type: string) => {
    if (type === 'academy') return <AcademyIcon size={16} color="var(--accent-cyan)" />;
    if (type === 'box') return <BoxIcon size={16} color="var(--accent-cyan)" />;
    if (type === 'settings') return <SettingsIcon size={16} color="var(--accent-purple)" />;
    if (type === 'play') return <PlayIcon size={16} color="var(--accent-cyan)" />;
    if (type === 'code') return <CodeIcon size={16} color="var(--accent-warning)" />;
    return <TrophyIcon size={16} color="var(--accent-warning)" />;
  };

  const completedCount = Object.values(progress).filter(l => l.completed).length;
  const progressPercent = Math.round((completedCount / LESSONS_DATA.length) * 100);

  // Compute Analytics values
  const totalAnswers = analytics.correctAnswers + analytics.incorrectAnswers;
  const accuracyPercent = totalAnswers > 0 ? Math.round((analytics.correctAnswers / totalAnswers) * 100) : 100;

  const timesArray = Object.values(analytics.completionTimes);
  const avgCompletionTimeStr = timesArray.length > 0 
    ? `${Math.round(timesArray.reduce((a, b) => a + b, 0) / timesArray.length)}s` 
    : '7.5 mins (Est.)';

  // Identify Strong / Weak Concepts dynamically
  const strongConcepts = [];
  const weakConcepts = [];

  if (progress[1]?.completed) strongConcepts.push('DFA Basics');
  if (progress[2]?.completed && analytics.incorrectAnswers <= 2) {
    strongConcepts.push('States & Alphabets');
  } else if (!progress[2]?.completed) {
    weakConcepts.push('States & Alphabet definitions');
  }

  if (progress[3]?.completed) {
    strongConcepts.push('Transition Functions');
  } else if (analytics.incorrectAnswers > 2) {
    weakConcepts.push('Transition Mappings');
  }

  if (strongConcepts.length === 0) strongConcepts.push('Initial exploration');
  if (weakConcepts.length === 0) weakConcepts.push('None identified');

  // VIEW 1: Individual Interactive Lesson Viewport
  if (activeLessonId !== null) {
    const activeLesson = LESSONS_DATA.find(l => l.id === activeLessonId)!;
    const lessonProgress = progress[activeLessonId] || { completed: false, unlocked: false };

    return (
      <div className="lesson-view-container av-tab-transition">
        {/* Left Sub-Sidebar */}
        <aside className="lesson-sidebar">
          <div className="lesson-sidebar-title">Lessons</div>
          {LESSONS_DATA.map((lesson) => {
            const isCurrent = lesson.id === activeLessonId;
            const lp = progress[lesson.id] || { completed: false, unlocked: true };
            
            return (
              <div
                key={lesson.id}
                className={`lesson-sidebar-item ${isCurrent ? 'active' : ''}`}
                onClick={() => setActiveLessonId(lesson.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {renderIcon(lesson.iconType)}
                  <span>{lesson.title}</span>
                </div>
                {lp.completed && (
                  <span style={{ color: 'var(--accent-success)', display: 'flex', alignItems: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </div>
            );
          })}

          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <Button variant="ghost" size="sm" onClick={() => setActiveLessonId(null)} style={{ width: '100%' }}>
              Back to Overview
            </Button>
          </div>
        </aside>

        {/* Right Content Panel Area */}
        <div className="lesson-content-area">
          <Card className="lesson-content-card">
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="lesson-badge">{activeLesson.difficulty}</span>
                <h1 className="view-title" style={{ marginTop: '8px', fontSize: '24px' }}>{activeLesson.title}</h1>
                <span className="lesson-meta-text">{activeLesson.time} • Lesson {activeLesson.id} of 6</span>
              </div>
              <div className="status-indicator-icon completed" style={{ opacity: lessonProgress.completed ? 1 : 0.1 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            {/* Custom Interactive Layouts */}
            {activeLessonId === 1 && (
              <LessonOneInteractive setActiveTab={setActiveTab} />
            )}
            
            {activeLessonId === 2 && (
              <LessonTwoInteractive onComplete={() => completeLesson(2)} recordAnswer={recordAnswer} />
            )}

            {activeLessonId === 3 && (
              <LessonThreeInteractive onComplete={() => completeLesson(3)} recordAnswer={recordAnswer} />
            )}

            {activeLessonId > 3 && (
              <div>
                <div style={{ whiteSpace: 'pre-line', color: 'var(--text-main)', fontSize: '14.5px', lineHeight: 1.7 }}>
                  {activeLesson.content}
                </div>
                <div style={{ marginTop: '32px', background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Sandbox Playground</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    [Interactive DFA diagram sandbox loaded: trace string sequences locally in follow-up labs.]
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Navigation buttons */}
            <div className="lesson-footer-nav" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px', marginTop: '32px' }}>
              <Button 
                variant="secondary" 
                onClick={handlePrevClick} 
                disabled={activeLessonId === 1}
              >
                Previous Lesson
              </Button>
              
              <Button 
                variant="primary" 
                glow 
                onClick={handleNextClick}
              >
                {activeLessonId === 6 ? 'Graduate Academy' : lessonProgress.completed ? 'Next Lesson' : 'Complete & Next'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // VIEW 2: Course Dashboard Grid Overview
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="av-tab-transition">
      {/* Academy Header Card */}
      <div className="academy-header-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Automata Academy</span>
            <h1 className="view-title" style={{ marginTop: '4px', marginBottom: '8px' }}>DFA Academy</h1>
            <p className="view-desc" style={{ maxWidth: '640px' }}>
              Master Deterministic Finite Automata through interactive lessons, visual simulations, and design challenges. Progress is saved locally.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {completedCount > 0 && (
              <Button variant="ghost" size="sm" onClick={resetProgress} style={{ color: 'var(--accent-error)' }}>
                Reset Course
              </Button>
            )}
          </div>
        </div>

        {/* Dashboard Toggle Panels */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <Button 
            variant={!showDashboard ? 'primary' : 'outline'} 
            size="sm" 
            onClick={() => setShowDashboard(false)}
          >
            Lessons Grid
          </Button>
          <Button 
            variant={showDashboard ? 'primary' : 'outline'} 
            size="sm" 
            onClick={() => setShowDashboard(true)}
            glow={showDashboard}
          >
            Academy Dashboard (Analytics)
          </Button>
        </div>
      </div>

      {!showDashboard ? (
        <>
          {/* Coordinated Progress Bar */}
          <div className="academy-progress-wrapper" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '8px' }}>
            <div className="academy-progress-text">
              <span>Course Completion</span>
              <span style={{ color: progressPercent > 0 ? 'var(--accent-cyan)' : 'var(--text-dimmed)' }}>{progressPercent}%</span>
            </div>
            <div className="academy-progress-bar-bg" style={{ marginTop: '8px' }}>
              <div className="academy-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {/* Grid Overview of Lessons */}
          <div className="academy-grid">
            {LESSONS_DATA.map((lesson) => {
              const lp = progress[lesson.id] || { completed: false, unlocked: true };
              const isCompleted = lp.completed;
              
              return (
                <LessonCard
                  key={lesson.id}
                  id={lesson.id}
                  title={lesson.title}
                  desc={lesson.desc}
                  time={lesson.time}
                  difficulty={lesson.difficulty}
                  iconType={lesson.iconType}
                  isCompleted={isCompleted}
                  onClick={() => setActiveLessonId(lesson.id)}
                />
              );
            })}
          </div>

          {/* Section: Animation/Simulation */}
          <div id="animation-simulation-section" className="academy-nav-section" style={{ marginTop: '32px', borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
            <h2 className="section-title" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '10px' }}>Animation/Simulation</h2>
            <Card glass style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: 'var(--text-main)', fontSize: '14.5px', fontWeight: 600 }}>DFA Step-by-Step Transition Animation</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginTop: '6px', lineHeight: 1.45 }}>Watch state transition animations activate and tokens slide step-by-step as you process regular language strings.</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => { setActiveLessonId(1); }} glow>
                Launch Animation
              </Button>
            </Card>
          </div>

          {/* Section: Interactive Simulator */}
          <div id="interactive-simulator-section" className="academy-nav-section" style={{ marginTop: '24px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
            <h2 className="section-title" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-purple)', marginBottom: '10px' }}>Interactive Simulator</h2>
            <Card glass style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: 'var(--text-main)', fontSize: '14.5px', fontWeight: 600 }}>Sandbox State Transition Testing</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginTop: '6px', lineHeight: 1.45 }}>Debug DFA and NFA logic instantly. Feed arbitrary string inputs into the machine and trace active execution pathways.</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => { setActiveLessonId(5); }} glow>
                Open Simulator
              </Button>
            </Card>
          </div>

          {/* Section: Automata Builder/Canvas */}
          <div id="automata-builder-section" className="academy-nav-section" style={{ marginTop: '24px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
            <h2 className="section-title" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-success)', marginBottom: '10px' }}>Automata Builder/Canvas</h2>
            <Card glass style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: 'var(--text-main)', fontSize: '14.5px', fontWeight: 600 }}>Challenge Design Workbench</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginTop: '6px', lineHeight: 1.45 }}>Build and draw your own custom DFA or NFA states, alphabets, and complete transition mappings.</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => { setActiveLessonId(6); }} glow>
                Open Builder
              </Button>
            </Card>
          </div>
        </>
      ) : (
        /* LEARNING ANALYTICS DASHBOARD VIEWPORT */
        <div className="analytics-grid animate-scale-in">
          
          {/* Card 1: Circular Progress Gauge for DFA Mastery */}
          <div className="analytics-stat-card">
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>DFA Mastery Index</div>
            <div style={{ position: 'relative' }}>
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path 
                  className="circle-fill cyan" 
                  strokeDasharray={`${progressPercent}, 100`} 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                />
                <text x="18" y="20.35" className="percentage-text">{progressPercent}%</text>
              </svg>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
              Combined score evaluating completed lessons and successful challenge completions.
            </div>
          </div>

          {/* Card 2: Interactive Answers Accuracy tracker */}
          <div className="analytics-stat-card">
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Exercise Accuracy</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{accuracyPercent}%</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dimmed)', marginTop: '4px' }}>Overall accuracy rate</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'right' }}>
                <span style={{ fontSize: '12px', color: 'var(--accent-success)' }}>{analytics.correctAnswers} Correct</span>
                <span style={{ fontSize: '12px', color: 'var(--accent-error)' }}>{analytics.incorrectAnswers} Incorrect</span>
              </div>
            </div>
            {/* Animated progress bar */}
            <div className="academy-progress-bar-bg" style={{ height: '4px', marginTop: '8px' }}>
              <div className="academy-progress-bar-fill" style={{ width: `${accuracyPercent}%` }} />
            </div>
          </div>

          {/* Card 3: Concept Strength Auditor */}
          <div className="analytics-stat-card">
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-warning)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cognitive Profiles</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dimmed)', display: 'block', marginBottom: '6px' }}>Strong Areas</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {strongConcepts.map((concept, i) => (
                    <span key={i} className="concept-badge strong">
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--accent-success)' }} />
                      {concept}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dimmed)', display: 'block', marginBottom: '6px' }}>Needs Review</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {weakConcepts.map((concept, i) => (
                    <span key={i} className="concept-badge weak">
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--accent-error)' }} />
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Learning Streaks & Average Completion time */}
          <div className="analytics-stat-card">
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sustained Activity</div>
            
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '10px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dimmed)', textTransform: 'uppercase' }}>Daily Streak</div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  🔥 {analytics.streak} Days
                </div>
              </div>

              <div style={{ flex: 1, borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dimmed)', textTransform: 'uppercase' }}>Avg Duration</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                  ⏱️ {avgCompletionTimeStr}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default DfaAcademy;
