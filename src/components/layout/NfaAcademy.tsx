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

interface NfaAcademyProps {
  setActiveTab: (tab: any) => void;
  awardRewards?: (type: 'lesson' | 'quiz' | 'challenge' | 'achievement', id: string, extra?: any) => void;
  showToast?: (message: string) => void;
}

// -------------------------------------------------------------
// CHAPTER COMPONENTS
// -------------------------------------------------------------

// Chapter 1: Try It Simulator
const ChapterOneDemo: React.FC<{ showToast?: (m: string) => void }> = ({ showToast }) => {
  const [inputStr, setInputStr] = useState('101');
  const [activeNodes, setActiveNodes] = useState<string[]>(['q0']);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simIndex, setSimIndex] = useState(-1);

  const simulateStep = async () => {
    setIsSimulating(true);
    let current = ['q0'];
    setActiveNodes(['q0']);
    setSimIndex(-1);

    for (let i = 0; i < inputStr.length; i++) {
      setSimIndex(i);
      const symbol = inputStr[i];
      let nextStates: string[] = [];

      // Simple NFA rules:
      // q0 on 0 -> {q0}
      // q0 on 1 -> {q0, q1}
      // q1 on 0 -> {q2}
      // q1 on 1 -> {}
      // q2 on 0 or 1 -> {}
      current.forEach((st) => {
        if (st === 'q0') {
          nextStates.push('q0');
          if (symbol === '1') nextStates.push('q1');
        } else if (st === 'q1') {
          if (symbol === '0') nextStates.push('q2');
        }
      });

      // Filter duplicates
      current = Array.from(new Set(nextStates));
      setActiveNodes(current);
      await new Promise((r) => setTimeout(r, 1200));
    }

    setIsSimulating(false);
    const accepted = current.includes('q2');
    showToast?.(accepted ? '✨ String accepted by NFA!' : '❌ String rejected by NFA.');
  };

  return (
    <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
      <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '8px' }}>Test Sandbox: Match substring '10'</h4>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input 
          type="text" 
          value={inputStr} 
          onChange={(e) => setInputStr(e.target.value.replace(/[^01]/g, ''))}
          disabled={isSimulating}
          style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '6px 12px', fontSize: '13px', color: 'var(--text-main)', flex: 1, fontFamily: 'var(--font-mono)' }}
        />
        <Button variant="primary" size="sm" onClick={simulateStep} disabled={isSimulating}>
          {isSimulating ? 'Simulating...' : 'Try It'}
        </Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', background: 'var(--bg-panel)', padding: '20px', borderRadius: '6px', position: 'relative' }}>
        {/* Render simple graph */}
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          {['q0', 'q1', 'q2'].map((node) => {
            const isActive = activeNodes.includes(node);
            const isFinal = node === 'q2';
            return (
              <div 
                key={node} 
                className={`nfa-node-element ${isActive ? 'active' : ''}`}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: isActive ? '2px solid var(--accent-cyan)' : '1.5px solid var(--border-strong)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: isActive ? 'rgba(61, 235, 255, 0.15)' : 'var(--bg-card)',
                  boxShadow: isActive ? '0 0 12px var(--accent-cyan-glow)' : 'none',
                  position: 'relative',
                  transition: 'all 0.3s ease'
                }}
              >
                {node}
                {isFinal && (
                  <div style={{ position: 'absolute', inset: '2px', borderRadius: '50%', border: isActive ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-strong)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Stream indicators */}
      <div style={{ marginTop: '12px', display: 'flex', gap: '4px', justifyContent: 'center' }}>
        {inputStr.split('').map((char, idx) => (
          <span 
            key={idx} 
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              background: simIndex === idx ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
              color: simIndex === idx ? '#000' : 'var(--text-muted)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600
            }}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
};

// Chapter 2: Animated Comparison Cards
const ChapterTwoDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transitions' | 'acceptance'>('transitions');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
        <button 
          onClick={() => setActiveTab('transitions')}
          style={{ background: 'none', border: 'none', color: activeTab === 'transitions' ? 'var(--accent-cyan)' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
        >
          Transitions
        </button>
        <button 
          onClick={() => setActiveTab('acceptance')}
          style={{ background: 'none', border: 'none', color: activeTab === 'acceptance' ? 'var(--accent-cyan)' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
        >
          Acceptance
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px' }} className="animate-scale-in">
        <Card glass style={{ flex: 1, padding: '16px', borderColor: 'rgba(255,255,255,0.05)' }}>
          <h5 style={{ fontSize: '12px', color: 'var(--text-dimmed)', textTransform: 'uppercase', marginBottom: '8px' }}>DFA (Deterministic)</h5>
          {activeTab === 'transitions' && (
            <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
              Every state must have exactly <strong>one path</strong> for each input symbol. No dead-ends or parallel options are allowed.
            </p>
          )}
          {activeTab === 'acceptance' && (
            <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
              Exactly one path is traced. Accepts if the final state reached is in the double circle.
            </p>
          )}
        </Card>

        <Card glass style={{ flex: 1, padding: '16px', border: '1px solid rgba(61, 235, 255, 0.2)', boxShadow: '0 0 12px var(--accent-cyan-glow)' }}>
          <h5 style={{ fontSize: '12px', color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '8px' }}>NFA (Non-Deterministic)</h5>
          {activeTab === 'transitions' && (
            <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
              States can have <strong>zero, one, or multiple</strong> transitions for a single symbol. Execution branches in parallel!
            </p>
          )}
          {activeTab === 'acceptance' && (
            <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
              Accepts if <strong>at least one</strong> parallel path terminates in an accept state.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

// Chapter 3: Interactive Components Selector
const ChapterThreeDemo: React.FC = () => {
  const [selectedComp, setSelectedComp] = useState<'states' | 'alphabet' | 'transitions' | 'start' | 'final'>('states');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'states', name: 'Q (States)' },
          { id: 'alphabet', name: 'Σ (Alphabet)' },
          { id: 'transitions', name: 'δ (Transitions)' },
          { id: 'start', name: 'q0 (Start)' },
          { id: 'final', name: 'F (Final)' }
        ].map((comp) => (
          <Button 
            key={comp.id} 
            variant={selectedComp === comp.id ? 'primary' : 'outline'} 
            size="sm" 
            onClick={() => setSelectedComp(comp.id as any)}
          >
            {comp.name}
          </Button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '16px', background: 'var(--bg-panel)', padding: '16px', borderRadius: '6px', position: 'relative', minHeight: '140px', alignItems: 'center', justifyContent: 'center' }}>
        {/* Visual interactive diagram */}
        <svg width="300" height="120" viewBox="0 0 300 120">
          <defs>
            <marker id="nfa-comp-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={selectedComp === 'transitions' || selectedComp === 'start' ? 'var(--accent-cyan)' : 'var(--graph-arrow)'} />
            </marker>
          </defs>

          {/* Start arrow */}
          <path 
            d="M 20 60 L 48 60" 
            stroke={selectedComp === 'start' ? 'var(--accent-cyan)' : 'var(--graph-start-arrow)'} 
            strokeWidth={selectedComp === 'start' ? 3 : 2}
            fill="none"
            markerEnd="url(#nfa-comp-arrow)"
          />
          <text 
            x="32" 
            y="50" 
            fontSize="10" 
            fontFamily="var(--font-mono)"
            fill={selectedComp === 'start' ? 'var(--accent-cyan)' : 'var(--text-muted)'} 
            fontWeight="bold"
            textAnchor="middle"
          >
            Start
          </text>

          {/* Transition Arrow */}
          <path 
            d="M 90 60 L 188 60" 
            stroke={selectedComp === 'transitions' ? 'var(--accent-cyan)' : 'var(--graph-edge)'} 
            strokeWidth={selectedComp === 'transitions' ? 3 : 2}
            fill="none"
            markerEnd="url(#nfa-comp-arrow)"
          />
          <text 
            x="140" 
            y="48" 
            fontSize="11" 
            fontFamily="var(--font-mono)"
            fill={selectedComp === 'alphabet' || selectedComp === 'transitions' ? 'var(--accent-cyan)' : 'var(--graph-label-text)'} 
            stroke="var(--graph-label-bg)"
            strokeWidth="4"
            paintOrder="stroke"
            fontWeight="bold"
            textAnchor="middle"
          >
            a
          </text>

          {/* Node 1 */}
          <circle 
            cx="70" 
            cy="60" 
            r="20" 
            fill="var(--bg-card)" 
            stroke={selectedComp === 'start' || selectedComp === 'states' ? 'var(--accent-cyan)' : 'var(--border-strong)'} 
            strokeWidth={selectedComp === 'start' || selectedComp === 'states' ? 3 : 1.5} 
          />
          <text x="70" y="64" textAnchor="middle" fill="var(--text-main)" fontSize="12" fontWeight="bold">q0</text>

          {/* Node 2 */}
          <circle 
            cx="210" 
            cy="60" 
            r="20" 
            fill="var(--bg-card)" 
            stroke={selectedComp === 'final' || selectedComp === 'states' ? 'var(--accent-cyan)' : 'var(--border-strong)'} 
            strokeWidth={selectedComp === 'final' || selectedComp === 'states' ? 3 : 1.5} 
          />
          <circle 
            cx="210" 
            cy="60" 
            r="16" 
            fill="none" 
            stroke={selectedComp === 'final' ? 'var(--accent-cyan)' : 'var(--border-strong)'} 
            strokeWidth="1.5" 
          />
          <text x="210" y="64" textAnchor="middle" fill="var(--text-main)" fontSize="12" fontWeight="bold">q1</text>
        </svg>

        {/* Explainers card */}
        <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', textAlign: 'center', color: 'var(--accent-cyan)' }}>
          {selectedComp === 'states' && 'Q = {q0, q1}: The full finite set of states in the automaton.'}
          {selectedComp === 'alphabet' && 'Σ = {a, b}: The alphabet. Set of symbols allowed in input string.'}
          {selectedComp === 'transitions' && 'δ: State transition rules. E.g. δ(q0, a) = {q1}.'}
          {selectedComp === 'start' && 'q0: The entrance node of the machine where calculations initiate.'}
          {selectedComp === 'final' && 'F = {q1}: Double circled states that accept input strings.'}
        </div>
      </div>
    </div>
  );
};

// Chapter 4: Multiple Transitions
const ChapterFourDemo: React.FC = () => {
  const [animating, setAnimating] = useState(false);
  const [particles, setParticles] = useState<{ x: number; y: number; id: number }[]>([]);

  const handlePlay = () => {
    if (animating) return;
    setAnimating(true);
    setParticles([
      { x: 50, y: 60, id: 1 },
      { x: 50, y: 60, id: 2 }
    ]);

    // Animate split
    setTimeout(() => {
      setParticles([
        { x: 50, y: 60, id: 1 }, // self loop path (mocked coordinates)
        { x: 190, y: 60, id: 2 } // right path
      ]);
    }, 100);

    setTimeout(() => {
      setAnimating(false);
      setParticles([]);
    }, 1800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Click play to watch input symbol "1" branch simultaneously</span>
        <Button variant="primary" size="sm" onClick={handlePlay} disabled={animating}>
          {animating ? 'Exploring...' : '▶ Play Animation'}
        </Button>
      </div>

      <div style={{ height: '140px', background: 'var(--bg-panel)', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <svg width="300" height="120" viewBox="0 0 300 120">
          <defs>
            <marker id="ch4-arrow-cyan" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-cyan)" />
            </marker>
            <marker id="ch4-arrow-purple" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-purple)" />
            </marker>
          </defs>

          {/* Start arrow */}
          <path d="M 20 60 L 48 60" stroke="var(--accent-cyan)" strokeWidth="2" fill="none" markerEnd="url(#ch4-arrow-cyan)" />
          <text x="32" y="50" fontSize="10" fontFamily="var(--font-mono)" fill="var(--text-muted)" fontWeight="bold" textAnchor="middle">Start</text>

          {/* Path 1: Self Loop */}
          <path d="M 56 48 C 20 20, 20 100, 56 72" stroke="var(--accent-cyan)" strokeWidth="2" strokeDasharray={animating ? '4 4' : 'none'} fill="none" markerEnd="url(#ch4-arrow-cyan)" />
          <text x="22" y="64" fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold" fill="var(--accent-cyan)" stroke="var(--graph-label-bg)" strokeWidth="4" paintOrder="stroke" textAnchor="middle">1</text>

          {/* Path 2: Transition to q1 */}
          <path d="M 90 60 L 188 60" stroke="var(--accent-purple)" strokeWidth="2" strokeDasharray={animating ? '4 4' : 'none'} fill="none" markerEnd="url(#ch4-arrow-purple)" />
          <text x="140" y="48" fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold" fill="var(--accent-purple)" stroke="var(--graph-label-bg)" strokeWidth="4" paintOrder="stroke" textAnchor="middle">1</text>

          {/* Node 1 */}
          <circle cx="70" cy="60" r="20" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="1.5" />
          <text x="70" y="64" textAnchor="middle" fill="var(--text-main)" fontSize="12" fontWeight="bold">q0</text>

          {/* Node 2 */}
          <circle cx="210" cy="60" r="20" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="1.5" />
          <text x="210" y="64" textAnchor="middle" fill="var(--text-main)" fontSize="12" fontWeight="bold">q1</text>

          {/* Animating Particles */}
          {particles.map((p) => (
            <circle 
              key={p.id} 
              cx={p.x} 
              cy={p.y} 
              r="6" 
              fill={p.id === 1 ? 'var(--accent-cyan)' : 'var(--accent-purple)'} 
              style={{ transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)', filter: 'drop-shadow(0 0 6px rgba(61,235,255,0.8))' }} 
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

// Chapter 5: Acceptance of Strings Tree Animation
const ChapterFiveDemo: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isStepsExpanded, setIsStepsExpanded] = useState(false);

  const treeSteps = [
    { title: 'Read Character: "1"', text: 'Start state Q0 splits on 1: one branch goes to q0, one goes to q1.', highlight: 'step1' },
    { title: 'Read Character: "0"', text: 'Branch at q1 goes to q2 (Final State). Branch at q0 stays at q0.', highlight: 'step2' },
    { title: 'Validate String: "10"', text: 'String terminates. The branch at q2 accepts! The entire machine accepts.', highlight: 'step3' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() => setIsStepsExpanded((prev: boolean) => !prev)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '4px',
            border: '1px solid var(--border-subtle)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-main)',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            width: 'fit-content',
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{ fontSize: '10px', transition: 'transform 0.3s ease', transform: isStepsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>
            {isStepsExpanded ? '▲' : '▼'}
          </span>
          <span>Steps</span>
        </button>

        <div
          style={{
            maxHeight: isStepsExpanded ? '300px' : '0px',
            opacity: isStepsExpanded ? 1 : 0,
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          {treeSteps.map((step, idx) => (
            <button 
              key={idx}
              onClick={() => setActiveStep(idx)}
              style={{
                flex: '1 1 140px',
                padding: '8px',
                borderRadius: '4px',
                border: 'none',
                background: activeStep === idx ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
                color: activeStep === idx ? '#000' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {step.title}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px', background: 'var(--bg-panel)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '16px' }}>
          {treeSteps[activeStep].text}
        </p>

        {/* Tree Path Diagram */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          <div style={{ padding: '4px 12px', border: '1.5px solid var(--border-strong)', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
            Root: [q0]
          </div>

          <div style={{ display: 'flex', gap: '40px' }}>
            <div style={{
              padding: '6px 12px',
              border: activeStep >= 1 ? '1.5px solid rgba(255,255,255,0.2)' : '1.5px solid var(--border-strong)',
              borderRadius: '4px',
              fontSize: '11px',
              opacity: activeStep >= 0 ? 1 : 0.2,
              color: activeStep >= 1 ? 'var(--text-muted)' : '#fff',
              transition: 'all 0.3s'
            }}>
              Path 1: [q0] ➔ Reject
            </div>
            <div style={{
              padding: '6px 12px',
              border: activeStep >= 2 ? '2px solid var(--accent-success)' : activeStep >= 1 ? '1.5px solid var(--accent-cyan)' : '1.5px solid var(--border-strong)',
              borderRadius: '4px',
              fontSize: '11px',
              opacity: activeStep >= 1 ? 1 : 0.2,
              fontWeight: activeStep >= 2 ? 700 : 500,
              boxShadow: activeStep >= 2 ? '0 0 12px rgba(16,185,129,0.3)' : 'none',
              transition: 'all 0.3s'
            }}>
              Path 2: [q1] ➔ [q2] Accept! ✨
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Chapter 6: Interactive NFA Simulator Screen
const ChapterSixDemo: React.FC<{ showToast?: (m: string) => void }> = ({ showToast }) => {
  const [inputVal, setInputVal] = useState('1101');
  const [currentStates, setCurrentStates] = useState<string[]>(['q0']);
  const [simStepIdx, setSimStepIdx] = useState(-1);
  const [simActive, setSimActive] = useState(false);

  const handleSimulate = async () => {
    setSimActive(true);
    let states = ['q0'];
    setCurrentStates(['q0']);
    setSimStepIdx(-1);

    for (let i = 0; i < inputVal.length; i++) {
      setSimStepIdx(i);
      const symbol = inputVal[i];
      let nextStates: string[] = [];

      states.forEach((st) => {
        if (st === 'q0') {
          nextStates.push('q0');
          if (symbol === '1') nextStates.push('q1');
        } else if (st === 'q1') {
          if (symbol === '0') nextStates.push('q2');
          if (symbol === '1') nextStates.push('q1');
        } else if (st === 'q2') {
          if (symbol === '1') nextStates.push('q0'); // loopback jump
        }
      });

      states = Array.from(new Set(nextStates));
      setCurrentStates(states);
      await new Promise((r) => setTimeout(r, 1000));
    }

    setSimActive(false);
    const isAccepted = states.includes('q2');
    showToast?.(isAccepted ? '🎉 Simulation Complete: Accepted!' : '❌ Simulation Complete: Rejected.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input 
          type="text" 
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value.replace(/[^01]/g, ''))}
          disabled={simActive}
          style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '6px 12px', fontSize: '13px', color: 'var(--text-primary)', flex: 1, fontFamily: 'var(--font-mono)' }}
        />
        <Button variant="primary" size="sm" onClick={handleSimulate} disabled={simActive}>
          {simActive ? 'Simulating...' : 'Simulate'}
        </Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', background: 'var(--bg-panel)', padding: '24px', borderRadius: '6px', position: 'relative' }}>
        {['q0', 'q1', 'q2'].map((st) => {
          const isActive = currentStates.includes(st);
          const isFinal = st === 'q2';
          return (
            <div 
              key={st}
              style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                border: isActive ? '2px solid var(--accent-cyan)' : '1.5px solid var(--border-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? 'rgba(61, 235, 255, 0.15)' : 'var(--bg-card)',
                boxShadow: isActive ? '0 0 16px var(--accent-cyan-glow)' : 'none',
                fontSize: '13px',
                fontWeight: 700,
                position: 'relative',
                transition: 'all 0.25s'
              }}
            >
              {st}
              {isFinal && (
                <div style={{ position: 'absolute', inset: '3px', borderRadius: '50%', border: isActive ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-strong)' }} />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
        {inputVal.split('').map((char, index) => (
          <span 
            key={index}
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              background: simStepIdx === index ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)',
              color: simStepIdx === index ? '#000' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 600
            }}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
};

// Chapter 7: Complete Interactive NFA Quiz (10 Questions)
const QuizQuestions = [
  {
    question: "Consider a DFA with states Q={A, B, C, D, E} over Σ={0, 1}, where F={C, D} are accepting states. Transitions are: δ(A,0)=B, δ(A,1)=C; δ(B,0)=A, δ(B,1)=D; δ(C,0)=E, δ(C,1)=C; δ(D,0)=E, δ(D,1)=D; δ(E,0)=E, δ(E,1)=E. In DFA state minimization, which pairs of states are equivalent?",
    options: [
      "A and B are equivalent; C and D are equivalent.",
      "A and C are equivalent; B and D are equivalent.",
      "B and E are equivalent; C and D are equivalent.",
      "No two states are equivalent; the DFA is already minimal."
    ],
    correctIndex: 0,
    explanation: "States C and D are both accept states and behave identically on inputs 0 (both go to E) and 1 (both stay in accept states). A and B are non-accept states that behave symmetrically on 0 and 1, making them equivalent under the partition partition. Thus, {A, B} and {C, D} are equivalent state sets."
  },
  {
    question: "Let N = (Q, Σ, δ, q0, F) be an NFA where Q={q0, q1, q2}, Σ={a, b}, F={q2}, and transitions are: δ(q0,a)={q0, q1}, δ(q0,b)={q0}; δ(q1,b)={q2}; δ(q2,a)={q2}, δ(q2,b)={q2}. If we apply the subset construction algorithm, which of the following represents a reachable state in the equivalent DFA that is also an accepting state?",
    options: [
      "{q0, q2}",
      "{q0, q1}",
      "{q1}",
      "The empty set {}"
    ],
    correctIndex: 0,
    explanation: "Starting from DFA state {q0}, on 'a' we reach {q0, q1}. On 'b' from {q0, q1}, we transition to δ(q0,b) U δ(q1,b) = {q0} U {q2} = {q0, q2}. Since q2 is final in the NFA, any subset containing q2 is an accepting state in the DFA."
  },
  {
    question: "Consider an ε-NFA with states Q={A, B, C}, Σ={0, 1}, and transitions: δ(A,ε)={B}, δ(B,ε)={C}, δ(A,0)={A}, δ(B,1)={B}, δ(C,0)={C}. What is the ε-closure of state A, denoted E(A)?",
    options: [
      "{A, B, C}",
      "{A}",
      "{A, B}",
      "{B, C}"
    ],
    correctIndex: 0,
    explanation: "The ε-closure of a state includes the state itself, and any states reachable from it through paths of ε-transitions. A can reach B via ε, and from B we can reach C via ε, so E(A) = {A, B, C}."
  },
  {
    question: "Which of the following statements is mathematically true regarding the relationship between the language classes recognized by DFAs, NFAs, and ε-NFAs?",
    options: [
      "DFAs, NFAs, and ε-NFAs all recognize the exact same class of languages (Regular Languages).",
      "NFAs are strictly more powerful than DFAs because they can process non-regular languages.",
      "ε-NFAs are more powerful than ordinary NFAs because they can match context-free languages.",
      "DFAs are more powerful because they do not suffer from exponential state explosion."
    ],
    correctIndex: 0,
    explanation: "By equivalence proofs (powerset construction and epsilon elimination), DFAs, NFAs, and ε-NFAs have identical expressive power and all recognize precisely the class of regular languages."
  },
  {
    question: "For an NFA with states Q, what is the formal mathematical signature of the transition function δ?",
    options: [
      "δ: Q × Σ → 2^Q",
      "δ: Q × Σ → Q",
      "δ: Q × (Σ ∪ {ε}) → Q",
      "δ: 2^Q × Σ → 2^Q"
    ],
    correctIndex: 0,
    explanation: "The transition function δ of an NFA maps a state and an input symbol to a set of states (the power set of Q, denoted 2^Q)."
  },
  {
    question: "Using Thompson's Construction to build an NFA for the regular expression (ab)*, how many epsilon (ε) transitions are typically introduced in the standard structural mapping for the Kleene closure loop?",
    options: [
      "4 epsilon transitions",
      "2 epsilon transitions",
      "0 epsilon transitions",
      "1 epsilon transition"
    ],
    correctIndex: 0,
    explanation: "Thompson's construction for Kleene closure R* introduces 4 ε-transitions: one from the new start state to the start of R, one from the new start state to the new accept state, one from the accept of R back to the start of R, and one from the accept of R to the new accept state."
  },
  {
    question: "According to the Myhill-Nerode Theorem, the minimum number of states in a DFA recognizing a regular language L is equal to what?",
    options: [
      "The number of equivalence classes of the prefix relation R_L.",
      "The number of states in any NFA recognizing L.",
      "The length of the shortest string accepted by L plus one.",
      "The number of states in the powerset of L."
    ],
    correctIndex: 0,
    explanation: "The Myhill-Nerode Theorem states that L is regular if and only if the number of equivalence classes of its right-invariant equivalence relation R_L is finite, and this number is exactly the number of states in the minimal DFA."
  },
  {
    question: "If a language L is regular, the Pumping Lemma guarantees that any string w ∈ L with length |w| ≥ p (where p is the pumping length) can be split into w = xyz satisfying which conditions?",
    options: [
      "|xy| ≤ p, |y| > 0, and for all i ≥ 0, xy^iz ∈ L.",
      "|xy| ≥ p, |y| > 0, and for all i ≥ 0, xy^iz ∈ L.",
      "|y| ≤ p, |x| > 0, and for all i ≥ 0, xy^iz ∈ L.",
      "|yz| ≤ p, |y| > 0, and for all i ≥ 0, xy^iz ∈ L."
    ],
    correctIndex: 0,
    explanation: "The Pumping Lemma requires that the prefix y can be pumped: the length of xy is at most p, the pumped string y is non-empty (|y| > 0), and xy^iz remains in L for all non-negative integers i."
  },
  {
    question: "In converting an ε-NFA to a DFA, if a state subset S has ε-closure E(S) = {q0, q1, q2}, and under symbol 'a' we have δ(q0,a)={q1}, δ(q1,a)={}, and δ(q2,a)={q3}, what is the set of states reached in the DFA on input 'a'?",
    options: [
      "The ε-closure of {q1, q3}",
      "Exactly the set {q1, q3}",
      "The ε-closure of {q1}",
      "The empty set {}"
    ],
    correctIndex: 0,
    explanation: "When transitioning from a subset S on symbol 'a' in a DFA converted from an ε-NFA, we take the union of NFA transitions for all states in the closure of S, and then compute the ε-closure of that resulting set: E(δ(q0,a) ∪ δ(q1,a) ∪ δ(q2,a)) = E({q1, q3})."
  },
  {
    question: "Consider an NFA over Σ={0, 1} with states {q0, q1, q2}, start state q0, accept state q2. Transitions: δ(q0,0)={q0, q1}, δ(q0,1)={q0}; δ(q1,1)={q2}; δ(q2,0)={q2}, δ(q2,1)={q2}. Which of the following strings is rejected by this NFA?",
    options: [
      "0000",
      "01",
      "1101",
      "01100"
    ],
    correctIndex: 0,
    explanation: "The NFA requires a '0' to transition to q1, followed immediately by a '1' to reach accept state q2. If a string has no '1' following a '0' (such as '0000'), it cannot transition to q2 and is rejected."
  }
];

const ChapterSevenQuiz: React.FC<{
  awardRewards?: (type: 'lesson' | 'quiz' | 'challenge' | 'achievement', id: string, extra?: any) => void;
  showToast?: (m: string) => void;
  onQuizComplete: () => void;
}> = ({ awardRewards, showToast, onQuizComplete }) => {
  const [qIndex, setQIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerSubmit = () => {
    if (selectedOpt === null) return;
    setIsAnswered(true);
    const correct = selectedOpt === QuizQuestions[qIndex].correctIndex;
    if (correct) {
      setScore((prev) => prev + 1);
      showToast?.('✨ Correct Answer!');
    } else {
      showToast?.('❌ Incorrect Answer.');
    }
  };

  const handleNext = () => {
    setIsAnswered(false);
    setSelectedOpt(null);
    if (qIndex < QuizQuestions.length - 1) {
      setQIndex((prev) => prev + 1);
    } else {
      // Quiz complete
      awardRewards?.('challenge', 'nfa_graduation_quiz', 'Daily');
      onQuizComplete();
    }
  };

  const currentQ = QuizQuestions[qIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-scale-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700 }}>
          Question {qIndex + 1} of {QuizQuestions.length}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-dimmed)' }}>
          Score: {score}/{QuizQuestions.length}
        </span>
      </div>

      <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.45 }}>{currentQ.question}</h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {currentQ.options.map((opt, oIdx) => {
          const isSelected = selectedOpt === oIdx;
          const isCorrect = oIdx === currentQ.correctIndex;
          
          let btnBorder = '1.5px solid var(--border-medium)';
          let btnBg = 'rgba(255,255,255,0.02)';

          if (isSelected) {
            btnBorder = '1.5px solid var(--accent-cyan)';
            btnBg = 'rgba(61,235,255,0.08)';
          }

          if (isAnswered) {
            if (isCorrect) {
              btnBorder = '2px solid var(--accent-success)';
              btnBg = 'rgba(16,185,129,0.12)';
            } else if (isSelected) {
              btnBorder = '2px solid var(--accent-error)';
              btnBg = 'rgba(239,68,68,0.12)';
            }
          }

          return (
            <button 
              key={oIdx}
              onClick={() => !isAnswered && setSelectedOpt(oIdx)}
              disabled={isAnswered}
              style={{
                textAlign: 'left',
                padding: '12px 16px',
                borderRadius: '6px',
                border: btnBorder,
                background: btnBg,
                color: 'var(--text-main)',
                fontSize: '13px',
                cursor: isAnswered ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: isSelected ? '4px solid var(--accent-cyan)' : '1.5px solid var(--border-strong)',
                background: isSelected ? 'none' : 'transparent',
                display: 'inline-block'
              }} />
              {opt}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div style={{ background: 'rgba(255,200,87,0.06)', border: '1px solid rgba(255,200,87,0.2)', padding: '12px', borderRadius: '6px', fontSize: '12px', lineHeight: 1.45, color: '#FFC857' }}>
          <strong>Explanation:</strong> {currentQ.explanation}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
        {!isAnswered ? (
          <Button variant="primary" size="md" onClick={handleAnswerSubmit} disabled={selectedOpt === null}>
            Submit Answer
          </Button>
        ) : (
          <Button variant="primary" size="md" onClick={handleNext}>
            {qIndex === QuizQuestions.length - 1 ? 'Finish Course' : 'Next Question'}
          </Button>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// NFA PRACTICE MODULE: Questions Database & Practice Session
// -------------------------------------------------------------
interface PracticeQuestion {
  id: number;
  type: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  xpReward: number;
  hint: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hasDiagram?: boolean;
  title: string;
  category: string;
  estTime: string;
}

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
  {
    id: 1,
    title: "NFA to DFA Subset Reachability",
    category: "NFA to DFA Conversion",
    type: "Convert",
    difficulty: "Hard",
    xpReward: 45,
    hint: "Systematically compute reachable subset states starting from {q0}.",
    question: "Given an NFA over Σ={a, b} with states Q={q0, q1, q2, q3}, start state q0, final state {q3}, and transitions:\nδ(q0, a)={q0, q1}, δ(q0, b)={q0};\nδ(q1, a)={q2}, δ(q1, b)={q2};\nδ(q2, a)={q3}, δ(q2, b)={q3};\nδ(q3, a)=Ø, δ(q3, b)=Ø.\nHow many reachable subset states (including dead/empty state if reachable) exist in the equivalent DFA?",
    options: ["8 states", "16 states", "6 states", "10 states"],
    correctIndex: 0,
    explanation: "Starting from {q0}, subset construction produces: {q0}, {q0,q1}, {q0,q1,q2}, {q0,q2}, {q0,q1,q2,q3}, {q0,q2,q3}, {q0,q1,q3}, and {q0,q3}. All 8 subsets are reachable via distinct input paths under subset construction.",
    hasDiagram: false,
    estTime: "4m"
  },
  {
    id: 2,
    title: "Epsilon Closure Recursive Union",
    category: "Epsilon Closure",
    type: "Trace",
    difficulty: "Medium",
    xpReward: 40,
    hint: "Trace all paths reachable using only ε-transitions starting from A.",
    question: "Consider an ε-NFA with states Q={A, B, C, D, E} and alphabet Σ={0, 1}. Epsilon transitions are:\nδ(A, ε)={B, C}, δ(B, ε)={D}, δ(C, 0)={A}, δ(D, ε)={E}, δ(E, 1)={B}.\nWhat is the exact ε-closure of state A, denoted E(A)?",
    options: ["{A, B, C, D, E}", "{A, B, C}", "{A, B, D}", "{A, C, D, E}"],
    correctIndex: 0,
    explanation: "E(A) includes A initially. Following ε-edges: A -> B, C. From B -> D via ε. From D -> E via ε. Non-ε edges (C-0->A and E-1->B) are ignored during ε-closure computation. Thus E(A) = {A, B, C, D, E}.",
    hasDiagram: false,
    estTime: "3.5m"
  },
  {
    id: 3,
    title: "DFA Minimization Partition Refinement",
    category: "DFA Minimization",
    type: "Deduce",
    difficulty: "Hard",
    xpReward: 45,
    hint: "Run Moore's partition refinement algorithm starting with P0 = {{q0, q1, q2, q5}, {q3, q4}}.",
    question: "A DFA has Q={q0, q1, q2, q3, q4, q5}, Σ={0, 1}, start q0, accept F={q3, q4}. Transitions:\nδ(q0,0)=q1, δ(q0,1)=q2;\nδ(q1,0)=q3, δ(q1,1)=q4;\nδ(q2,0)=q4, δ(q2,1)=q3;\nδ(q3,0)=q5, δ(q3,1)=q5;\nδ(q4,0)=q5, δ(q4,1)=q5;\nδ(q5,0)=q5, δ(q5,1)=q5.\nWhich equivalence classes form the minimal DFA?",
    options: ["{q0}, {q1, q2}, {q3, q4}, {q5}", "{q0}, {q1}, {q2}, {q3, q4, q5}", "{q0, q1, q2}, {q3, q4}, {q5}", "{q0}, {q1, q2, q3, q4, q5}"],
    correctIndex: 0,
    explanation: "Initial partition P0 = {{q0, q1, q2, q5}, {q3, q4}}. Evaluating {q3, q4}: on 0 both go to q5, on 1 both go to q5, so {q3, q4} is valid. Evaluating {q1, q2}: on 0 q1->q3 & q2->q4 (both in {q3,q4}); on 1 q1->q4 & q2->q3 (both in {q3,q4}). Thus q1 & q2 are indistinguishable. q0 & q5 split into singleton classes. Merged states: {q1,q2} and {q3,q4}, giving 4 states.",
    hasDiagram: false,
    estTime: "4.5m"
  },
  {
    id: 4,
    title: "Minimal DFA Suffix Bounds",
    category: "DFA Practice",
    type: "Identify",
    difficulty: "Medium",
    xpReward: 35,
    hint: "Consider states representing prefixes of the target suffix '010'.",
    question: "What is the minimum number of states in a minimal DFA recognizing the language L = { w ∈ {0, 1}* | w ends with '010' }?",
    options: ["4 states", "3 states", "5 states", "6 states"],
    correctIndex: 0,
    explanation: "The equivalence classes under Myhill-Nerode correspond to prefixes of '010': ε (no suffix match), '0' (ends in 0), '01' (ends in 01), and '010' (ends in 010, accepting state). All 4 states are pairwise distinguishable, so 4 states are required.",
    hasDiagram: false,
    estTime: "3m"
  },
  {
    id: 5,
    title: "Product Automata State Cardinality",
    category: "Language Equivalence",
    type: "Deduce",
    difficulty: "Hard",
    xpReward: 50,
    hint: "Combine parity state count (mod 2) and arithmetic state count (mod 3) using product construction.",
    question: "Let L1 be binary strings with an odd number of 1s (minimal DFA has 2 states). Let L2 be binary strings representing numbers divisible by 3 (minimal DFA has 3 states). What is the exact state count of the minimal DFA for L1 ∩ L2?",
    options: ["6 states", "5 states", "4 states", "12 states"],
    correctIndex: 0,
    explanation: "The product construction yields 2 * 3 = 6 states corresponding to pairs (parity of 1s, value mod 3). Since gcd(2, 3) = 1, all 6 state pairs are reachable from the start state (Even, 0) and distinguishable under Myhill-Nerode.",
    hasDiagram: false,
    estTime: "4m"
  },
  {
    id: 6,
    title: "Myhill-Nerode Equivalence Classes",
    category: "State Tracing",
    type: "Identify",
    difficulty: "Hard",
    xpReward: 45,
    hint: "Formulate distinguishing suffixes for prefixes a^n and a^m where n ≠ m.",
    question: "For the language L = { a^n b^n | n ≥ 0 }, how many equivalence classes are formed by the Myhill-Nerode relation ≡L over Σ*?",
    options: ["Infinitely many equivalence classes", "2 equivalence classes", "1 equivalence class", "4 equivalence classes"],
    correctIndex: 0,
    explanation: "For any n ≠ m, the prefixes a^n and a^m are distinguished by suffix b^n, since a^n b^n ∈ L but a^m b^n ∉ L. Since infinitely many distinguishable prefixes exist, ≡L has infinite index, proving L is non-regular.",
    hasDiagram: false,
    estTime: "3.5m"
  },
  {
    id: 7,
    title: "DFA Execution Path Tracing",
    category: "State Tracing",
    type: "Trace",
    difficulty: "Medium",
    xpReward: 40,
    hint: "Trace each input sequence step-by-step through the transition function.",
    question: "Given a DFA with Q={A, B, C, D}, Σ={0, 1}, start A, accept C. Transitions:\nδ(A,0)=B, δ(A,1)=A;\nδ(B,0)=C, δ(B,1)=A;\nδ(C,0)=C, δ(C,1)=D;\nδ(D,0)=D, δ(D,1)=D.\nWhich of the following input strings terminates in the accept state C?",
    options: ["0100", "10010", "0010", "1101"],
    correctIndex: 0,
    explanation: "Tracing '0100': A --0--> B --1--> A --0--> B --0--> C. The execution halts in state C (accept). Tracing '10010': A->A->B->C->D->D (reject). Tracing '0010': A->B->C->D->D (reject).",
    hasDiagram: false,
    estTime: "3.5m"
  },
  {
    id: 8,
    title: "Epsilon Elimination Direct Transitions",
    category: "ε-NFA to DFA",
    type: "Convert",
    difficulty: "Hard",
    xpReward: 45,
    hint: "Compute E(q0), follow symbol 'a' transitions, and take the epsilon closure of reached states.",
    question: "An ε-NFA has states {q0, q1, q2}, start q0, final {q2}. Transitions: δ(q0, ε)={q1}, δ(q1, a)={q1}, δ(q1, ε)={q2}, δ(q2, b)={q2}. In the equivalent NFA without ε-transitions, what is δ'(q0, a)?",
    options: ["{q1, q2}", "{q1}", "{q0, q1}", "Ø"],
    correctIndex: 0,
    explanation: "E(q0) = {q0, q1, q2}. Taking transition 'a' from {q0, q1, q2}: only q1 moves to q1. The epsilon closure of q1 is E(q1) = {q1, q2}. Thus δ'(q0, a) = {q1, q2}.",
    hasDiagram: false,
    estTime: "4m"
  },
  {
    id: 9,
    title: "Pumping Lemma Derivation",
    category: "State Tracing",
    type: "Deduce",
    difficulty: "Hard",
    xpReward: 50,
    hint: "Recall that |xy| ≤ p forces y to consist exclusively of the initial symbol 0.",
    question: "In applying the Pumping Lemma for regular languages to L = { 0^n 1^n | n ≥ 0 } with pumping length p, why does pumping y in w = 0^p 1^p = xyz (where |xy| ≤ p and |y| > 0) derive a contradiction?",
    options: [
      "Because y consists entirely of 0s, so xy^2z contains more 0s than 1s and is not in L.",
      "Because y contains both 0s and 1s, destroying the alphabet formatting.",
      "Because y must be the empty string ε, contradicting |y| > 0.",
      "Because p cannot be chosen as an integer."
    ],
    correctIndex: 0,
    explanation: "Since |xy| ≤ p, the substring y occurs within the first p symbols and thus consists solely of 0s. Pumping y to y^2 yields xy^2z = 0^(p+|y|) 1^p, which has more 0s than 1s and is not in L.",
    hasDiagram: false,
    estTime: "3.5m"
  },
  {
    id: 10,
    title: "Unreachable State Elimination and Merging",
    category: "DFA Minimization",
    type: "Deduce",
    difficulty: "Hard",
    xpReward: 45,
    hint: "Identify equivalence between non-final states {A, B} and final states {C, D}.",
    question: "A DFA has Q={S, A, B, C, D}, start S, accept F={C, D}. Transitions:\nδ(S,0)=A, δ(S,1)=B;\nδ(A,0)=C, δ(A,1)=D;\nδ(B,0)=C, δ(B,1)=D;\nδ(C,0)=C, δ(C,1)=C;\nδ(D,0)=D, δ(D,1)=D.\nHow many states remain in the fully minimized DFA?",
    options: ["3 states", "2 states", "4 states", "5 states"],
    correctIndex: 0,
    explanation: "All states are reachable. P0 = {{S, A, B}, {C, D}}. States C and D transition to F on both 0 and 1, so {C, D} merge into 1 state. States A and B transition to {C, D} on both 0 and 1, so {A, B} merge into 1 state. Start state S remains separate. Minimized DFA has 3 states: {S}, {A,B}, and {C,D}.",
    hasDiagram: false,
    estTime: "4m"
  },
  {
    id: 11,
    title: "Inversion of DFA Accept States",
    category: "DFA Practice",
    type: "Identify",
    difficulty: "Medium",
    xpReward: 35,
    hint: "Complementing accept states in a complete minimal DFA preserves state minimality.",
    question: "Let M be a complete, minimal 4-state DFA over Σ={a, b} accepting strings containing 'aba'. If we invert the accept and non-accept states of M to form M', how many states are in the minimal DFA for M'?",
    options: ["4 states", "3 states", "5 states", "8 states"],
    correctIndex: 0,
    explanation: "Inverting the accept states of a complete minimal DFA creates a DFA for the complement language L'. Under Myhill-Nerode, two strings are distinguishable in L if and only if they are distinguishable in L'. Thus the minimal DFA for L' has the exact same number of states (4).",
    hasDiagram: false,
    estTime: "3m"
  },
  {
    id: 12,
    title: "NFA Multi-Thread Trace Verification",
    category: "NFA Practice",
    type: "Trace",
    difficulty: "Medium",
    xpReward: 40,
    hint: "Follow all active non-deterministic paths simultaneously.",
    question: "Given NFA Q={q0, q1, q2, q3}, Σ={0, 1}, start q0, accept q3. Transitions:\nδ(q0, 0)={q0, q1}, δ(q0, 1)={q0};\nδ(q1, 1)={q2};\nδ(q2, 0)={q3};\nδ(q3, 0)={q3}, δ(q3, 1)={q3}.\nWhich of the following input strings is ACCEPTED by this NFA?",
    options: ["010", "001", "110", "101"],
    correctIndex: 0,
    explanation: "Tracing '010': q0 --0--> q1 --1--> q2 --0--> q3 (accept). At least one path reaches accept state q3. Tracing '001', '110', '101' yields no path reaching q3.",
    hasDiagram: false,
    estTime: "3.5m"
  },
  {
    id: 13,
    title: "Regular Expression Language Difference",
    category: "Regular Expressions",
    type: "Deduce",
    difficulty: "Medium",
    xpReward: 40,
    hint: "Determine the language generated by R1 = (0|1)* and R2 = 0*(1 0*)*.",
    question: "Given regular expressions R1 = (0|1)* and R2 = 0*(1 0*)* over Σ={0, 1}, what is the set difference L(R1) \\ L(R2)?",
    options: ["Ø (Empty set)", "{1*}", "{01}", "{ε}"],
    correctIndex: 0,
    explanation: "Both R1 and R2 generate all possible binary strings over {0, 1}*. Since L(R1) = Σ* and L(R2) = Σ*, their set difference L(R1) \\ L(R2) = Σ* \\ Σ* = Ø.",
    hasDiagram: false,
    estTime: "3m"
  },
  {
    id: 14,
    title: "Reversal of Finite Automata",
    category: "NFA Practice",
    type: "Identify",
    difficulty: "Easy",
    xpReward: 30,
    hint: "Reversing arrows and swapping start/final states reverses the input strings.",
    question: "If a DFA M recognizes language L, we construct machine M^R by reversing all transition arrows and interchanging start and accept state roles. What language does M^R recognize?",
    options: ["The reversal language L^R", "The complement language L_bar", "The Kleene closure L*", "The empty language Ø"],
    correctIndex: 0,
    explanation: "Reversing all transitions and swapping start and accept states reverses the direction of computation paths, causing M^R to accept exactly the set of reversed strings L^R = { w^R | w ∈ L }.",
    hasDiagram: false,
    estTime: "2.5m"
  },
  {
    id: 15,
    title: "Subset Construction Dead State Transition",
    category: "NFA to DFA Conversion",
    type: "Convert",
    difficulty: "Medium",
    xpReward: 35,
    hint: "Evaluate NFA transition from q1 on symbol 'a'.",
    question: "An NFA has Q={q0, q1}, start q0, accept q1. Transitions: δ(q0, a)={q0, q1}, δ(q0, b)=Ø; δ(q1, a)=Ø, δ(q1, b)=Ø. In the equivalent DFA, what is δ_DFA({q1}, a)?",
    options: ["Ø (Dead state)", "{q0}", "{q1}", "{q0, q1}"],
    correctIndex: 0,
    explanation: "In subset construction, δ_DFA({q1}, a) = Union of δ_NFA(q1, a). Since δ_NFA(q1, a) = Ø, the transition targets the empty set Ø (the trap/dead state).",
    hasDiagram: false,
    estTime: "3m"
  },
  {
    id: 16,
    title: "State Bound for k-th Symbol from End",
    category: "DFA Practice",
    type: "Deduce",
    difficulty: "Hard",
    xpReward: 45,
    hint: "A DFA must remember the last k symbols processed.",
    question: "What is the minimum number of states in a DFA recognizing the language L_k = { w ∈ {0, 1}* | the k-th symbol from the right is 1 } for k = 4?",
    options: ["16 states", "8 states", "5 states", "32 states"],
    correctIndex: 0,
    explanation: "To determine if the 4th symbol from the right is 1, the DFA must remember the exact sequence of the last 4 symbols read. There are 2^4 = 16 distinct binary suffixes of length 4, forming 16 pairwise distinguishable equivalence classes.",
    hasDiagram: false,
    estTime: "3.5m"
  },
  {
    id: 17,
    title: "Arden's Lemma Linear Equation",
    category: "Regular Expressions",
    type: "Identify",
    difficulty: "Easy",
    xpReward: 30,
    hint: "R = Q + RP has a unique solution when ε ∉ P.",
    question: "According to Arden's Lemma, if P and Q are regular expressions over Σ and ε ∉ P, what is the unique solution to the equation R = Q + RP?",
    options: ["R = QP*", "R = P*Q", "R = Q*P", "R = (Q+P)*"],
    correctIndex: 0,
    explanation: "Arden's Lemma states that R = Q + RP has the unique solution R = QP* provided that P does not contain the null string ε.",
    hasDiagram: false,
    estTime: "2.5m"
  },
  {
    id: 18,
    title: "Regular and Non-Regular Set Intersections",
    category: "Language Equivalence",
    type: "Deduce",
    difficulty: "Hard",
    xpReward: 45,
    hint: "Test L1 = Ø versus L1 = Σ*.",
    question: "If L1 is regular and L2 is non-regular, which of the following statements is ALWAYS TRUE regarding L1 ∩ L2?",
    options: [
      "L1 ∩ L2 can be regular or non-regular depending on L1 and L2.",
      "L1 ∩ L2 is guaranteed to be regular.",
      "L1 ∩ L2 is guaranteed to be non-regular.",
      "L1 ∩ L2 must be context-free but non-regular."
    ],
    correctIndex: 0,
    explanation: "If L1 = Ø (regular), then Ø ∩ L2 = Ø (regular). But if L1 = Σ* (regular), then Σ* ∩ L2 = L2 (non-regular). Thus L1 ∩ L2 can be either regular or non-regular.",
    hasDiagram: false,
    estTime: "3.5m"
  },
  {
    id: 19,
    title: "Table Filling Base Case Initialization",
    category: "DFA Minimization",
    type: "Identify",
    difficulty: "Easy",
    xpReward: 30,
    hint: "Base step distinguishes accepting states from non-accepting states.",
    question: "In the Table Filling (Myhill-Nerode) algorithm for DFA minimization, when is a pair of states (p, q) marked as distinguishable in Step 0?",
    options: [
      "When one state is in F and the other is in Q \\ F.",
      "When both states have transitions to the start state.",
      "When both states belong to F.",
      "When δ(p, a) = δ(q, a) for all a ∈ Σ."
    ],
    correctIndex: 0,
    explanation: "Step 0 marks any pair (p, q) where one state is an accepting state (p ∈ F) and the other is a non-accepting state (q ∉ F), as they produce different outputs on the empty string ε.",
    hasDiagram: false,
    estTime: "2.5m"
  },
  {
    id: 20,
    title: "Homomorphic Closure of Regular Languages",
    category: "Regular Expressions",
    type: "Identify",
    difficulty: "Medium",
    xpReward: 35,
    hint: "Regular languages are closed under string substitution / homomorphism.",
    question: "If h: Σ* -> Γ* is a string homomorphism and L ⊆ Σ* is a regular language, what can be concluded about h(L) = { h(w) | w ∈ L }?",
    options: ["h(L) is always regular.", "h(L) is always non-regular.", "h(L) is context-free but never regular.", "h(L) is non-deterministic."],
    correctIndex: 0,
    explanation: "Regular languages are closed under homomorphism. Applying a homomorphism h to a regular expression for L yields a valid regular expression for h(L).",
    hasDiagram: false,
    estTime: "3m"
  },
  {
    id: 21,
    title: "Epsilon Path Parallel Language Expression",
    category: "ε-NFA Practice",
    type: "Convert",
    difficulty: "Medium",
    xpReward: 40,
    hint: "Combine the branched paths from q0 via ε jumps.",
    question: "An ε-NFA has Q={q0, q1, q2, q3}, start q0, final q3. Transitions: δ(q0, ε)={q1, q2}; δ(q1, a)={q1}, δ(q1, ε)={q3}; δ(q2, b)={q2}, δ(q2, ε)={q3}; δ(q3, c)={q3}. Which regular expression describes its language?",
    options: ["(a* | b*) c*", "(ab)* c*", "a* b* c*", "(a c* | b c*)"],
    correctIndex: 0,
    explanation: "From q0, ε jumps branch into a* (via q1) or b* (via q2), which both converge via ε into q3, followed by any number of c's (c*). Thus the language is (a* | b*) c*.",
    hasDiagram: false,
    estTime: "3.5m"
  },
  {
    id: 22,
    title: "Mod-7 Congruence DFA State Bound",
    category: "DFA Practice",
    type: "Identify",
    difficulty: "Hard",
    xpReward: 45,
    hint: "Binary numbers processed MSB first generate remainders modulo 7.",
    question: "What is the minimum number of states in a DFA accepting binary numbers N (processed MSB-first) such that N ≡ 3 (mod 7)?",
    options: ["7 states", "6 states", "8 states", "14 states"],
    correctIndex: 0,
    explanation: "A binary DFA for mod-7 arithmetic requires 7 states corresponding to remainders {0, 1, 2, 3, 4, 5, 6}. Since 7 is prime, all 7 remainders are reachable and distinguishable under Myhill-Nerode.",
    hasDiagram: false,
    estTime: "3m"
  },
  {
    id: 23,
    title: "Transition Function Trap State Debugging",
    category: "Automata Construction",
    type: "Debug",
    difficulty: "Medium",
    xpReward: 35,
    hint: "Trace strings from q0 to find which ones transition to q_dead.",
    question: "A DFA over {0,1} accepting strings starting with '01' has transitions:\nδ(q0, 0)=q1, δ(q0, 1)=q_dead;\nδ(q1, 0)=q_dead, δ(q1, 1)=q2;\nδ(q2, 0)=q2, δ(q2, 1)=q2;\nδ(q_dead, 0/1)=q_dead.\nAccept state is q2. Which input string transitions to q_dead?",
    options: ["001", "010", "0110", "0111"],
    correctIndex: 0,
    explanation: "Tracing '001': q0 --0--> q1 --0--> q_dead --1--> q_dead. Since the second symbol is '0' instead of '1', the DFA transitions to q_dead and rejects.",
    hasDiagram: false,
    estTime: "3m"
  },
  {
    id: 24,
    title: "Product Machine Upper Bound",
    category: "Language Equivalence",
    type: "Deduce",
    difficulty: "Easy",
    xpReward: 30,
    hint: "The state set of product machine M1 x M2 is Q1 x Q2.",
    question: "If DFA M1 has m states and DFA M2 has n states, what is the maximum number of states in the product DFA M1 × M2 constructed to recognize L(M1) ∩ L(M2)?",
    options: ["m × n", "m + n", "2^(m+n)", "m^n"],
    correctIndex: 0,
    explanation: "The product construction defines the state space as Q = Q1 × Q2, which contains exactly m × n state pairs.",
    hasDiagram: false,
    estTime: "2.5m"
  }
];

export const NfaAcademy: React.FC<NfaAcademyProps> = ({ setActiveTab, awardRewards, showToast }) => {
  const [activeSection, setActiveSection] = useState<'HUB' | 'LEARN' | 'STATS' | 'PRACTICE' | 'BANK'>('HUB');



  // --- Question Bank States ---
  const [qBankSearch, setQBankSearch] = useState('');
  const [qBankCategory, setQBankCategory] = useState<string>('All');
  const [qBankDifficulty, setQBankDifficulty] = useState<string>('All');
  const [qBankType] = useState<string>('All');
  const [qBankFilterStatus, setQBankFilterStatus] = useState<'All' | 'Bookmarked' | 'Solved' | 'Unsolved' | 'Incorrect'>('All');
  const [selectedQBankId, setSelectedQBankId] = useState<number>(1);

  // Persistence for user performance tagging & bookmarks
  const [qBankBookmarks, setQBankBookmarks] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('av_nfa_qbank_bookmarks');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [qBankAttempts, setQBankAttempts] = useState<Record<number, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('av_nfa_qbank_attempts');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const [qBankCorrects, setQBankCorrects] = useState<Record<number, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('av_nfa_qbank_corrects');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('av_nfa_qbank_bookmarks', JSON.stringify(qBankBookmarks));
  }, [qBankBookmarks]);

  useEffect(() => {
    localStorage.setItem('av_nfa_qbank_attempts', JSON.stringify(qBankAttempts));
  }, [qBankAttempts]);

  useEffect(() => {
    localStorage.setItem('av_nfa_qbank_corrects', JSON.stringify(qBankCorrects));
  }, [qBankCorrects]);
  
  // Learn Course states
  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const [completedChapters, setCompletedChapters] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('av_nfa_learn_progress');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [];
  });

  // --- Practice Mode states ---
  const [practiceDifficulty, setPracticeDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed' | null>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [practiceQIdx, setPracticeQIdx] = useState(0);
  const [practiceSelectedOpt, setPracticeSelectedOpt] = useState<number | null>(null);
  const [practiceIsAnswered, setPracticeIsAnswered] = useState(false);
  const [practiceAttemptCount, setPracticeAttemptCount] = useState(0);
  const [practiceCorrectCount, setPracticeCorrectCount] = useState(0);
  const [practiceElapsedTime, setPracticeElapsedTime] = useState(0);
  const [_practiceStreak, setPracticeStreak] = useState(0);
  const [practiceBestStreak, setPracticeBestStreak] = useState(0);
  const [practiceBookmarks, setPracticeBookmarks] = useState<number[]>([]);
  const [practiceShowHint, setPracticeShowHint] = useState(false);
  const [practiceShowSummary, setPracticeShowSummary] = useState(false);
  const [practiceTypeFilter, setPracticeTypeFilter] = useState<'All' | 'Identify' | 'Trace' | 'Convert'>('All');
  
  const [practiceBestScores, setPracticeBestScores] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('av_nfa_practice_best_scores');
      return saved ? JSON.parse(saved) : { Easy: 0, Medium: 0, Hard: 0, Mixed: 0 };
    }
    return { Easy: 0, Medium: 0, Hard: 0, Mixed: 0 };
  });

  useEffect(() => {
    localStorage.setItem('av_nfa_learn_progress', JSON.stringify(completedChapters));
  }, [completedChapters]);

  // Practice Timer
  useEffect(() => {
    if (activeSection !== 'PRACTICE' || practiceDifficulty === null || practiceShowSummary) return;
    const timer = setInterval(() => {
      setPracticeElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSection, practiceDifficulty, practiceShowSummary]);

  const handleChapterSelect = (chNum: number) => {
    const isUnlocked = chNum === 1 || completedChapters.includes(chNum - 1);
    if (!isUnlocked) {
      alert('🔒 Complete the preceding chapter to unlock this lesson!');
      return;
    }
    setActiveChapter(chNum);
    setActiveSection('LEARN');
  };

  const handleChapterComplete = () => {
    if (activeChapter === null) return;
    if (!completedChapters.includes(activeChapter)) {
      setCompletedChapters((prev) => [...prev, activeChapter]);
      awardRewards?.('lesson', `nfa_chapter_${activeChapter}`);
    }

    if (activeChapter < 7) {
      setActiveChapter((prev) => (prev !== null ? prev + 1 : 1));
    } else {
      showToast?.('🏆 Congratulations! You completed the Learn NFA course!');
      setActiveSection('HUB');
    }
  };

  // --- Practice Mode Handlers ---
  const startPracticeSession = (diff: 'Easy' | 'Medium' | 'Hard' | 'Mixed') => {
    setPracticeDifficulty(diff);
    setPracticeQIdx(0);
    setPracticeSelectedOpt(null);
    setPracticeIsAnswered(false);
    setPracticeAttemptCount(0);
    setPracticeCorrectCount(0);
    setPracticeElapsedTime(0);
    setPracticeStreak(0);
    setPracticeBestStreak(0);
    setPracticeShowHint(false);
    setPracticeShowSummary(false);

    let filtered = PRACTICE_QUESTIONS;
    if (diff !== 'Mixed') {
      filtered = PRACTICE_QUESTIONS.filter((q) => q.difficulty === diff);
    }
    if (practiceTypeFilter !== 'All') {
      filtered = filtered.filter((q) => q.type === practiceTypeFilter);
    }

    // Shuffle questions if Mixed Challenge
    if (diff === 'Mixed') {
      filtered = [...filtered].sort(() => Math.random() - 0.5);
    }

    setPracticeQuestions(filtered);
  };

  const handlePracticeSubmit = () => {
    if (practiceSelectedOpt === null) return;
    const q = practiceQuestions[practiceQIdx];
    const isCorrect = practiceSelectedOpt === q.correctIndex;

    // Tag performance attempts
    setQBankAttempts((prev) => ({
      ...prev,
      [q.id]: (prev[q.id] || 0) + 1
    }));
    if (isCorrect) {
      setQBankCorrects((prev) => ({
        ...prev,
        [q.id]: (prev[q.id] || 0) + 1
      }));
    }

    if (isCorrect) {
      setPracticeCorrectCount((prev) => prev + 1);
      setPracticeStreak((prev) => {
        const next = prev + 1;
        if (next > practiceBestStreak) setPracticeBestStreak(next);
        return next;
      });
      setPracticeIsAnswered(true);
      awardRewards?.('quiz', `nfa_practice_q_${q.id}`, { isCorrect: true, difficulty: q.difficulty || 'Easy' });
    } else {
      setPracticeStreak(0);
      if (practiceAttemptCount === 0) {
        setPracticeAttemptCount(1);
        showToast?.('❌ Incorrect. Try again! (1 retry remaining)');
      } else {
        setPracticeIsAnswered(true);
        showToast?.('❌ Incorrect. Correct answer revealed.');
      }
    }
  };

  const handlePracticeNext = () => {
    setPracticeIsAnswered(false);
    setPracticeSelectedOpt(null);
    setPracticeAttemptCount(0);
    setPracticeShowHint(false);

    if (practiceQIdx < practiceQuestions.length - 1) {
      setPracticeQIdx((prev) => prev + 1);
    } else {
      // Completed practice session!
      setPracticeShowSummary(true);
      
      // Update best scores
      const scoreKey = practiceDifficulty || 'Easy';
      const best = Math.max(practiceBestScores[scoreKey] || 0, practiceCorrectCount);
      const updatedScores = { ...practiceBestScores, [scoreKey]: best };
      setPracticeBestScores(updatedScores);
      localStorage.setItem('av_nfa_practice_best_scores', JSON.stringify(updatedScores));

      awardRewards?.('challenge', `nfa_practice_session_${scoreKey}`, 'Easy');
    }
  };

  const handlePracticeSkip = () => {
    handlePracticeNext();
  };

  const handleToggleBookmark = (idx: number) => {
    if (practiceBookmarks.includes(idx)) {
      setPracticeBookmarks((prev) => prev.filter((i) => i !== idx));
    } else {
      setPracticeBookmarks((prev) => [...prev, idx]);
      showToast?.('🏷️ Question bookmarked!');
    }
  };

  const retryIncorrectQuestions = () => {
    // Reload incorrect / failed questions
    setPracticeQIdx(0);
    setPracticeSelectedOpt(null);
    setPracticeIsAnswered(false);
    setPracticeAttemptCount(0);
    setPracticeCorrectCount(0);
    setPracticeElapsedTime(0);
    setPracticeShowSummary(false);
  };

  const resetPractice = () => {
    setPracticeDifficulty(null);
    setPracticeQuestions([]);
    setPracticeShowSummary(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentProgressPercent = Math.round((completedChapters.length / 7) * 100);

  const syllabus = [
    { num: 1, title: 'What is an NFA?', desc: 'Definition, characteristics, real-world analogies, and interactive sandbox trace runs.', time: '5 mins', difficulty: 'Beginner', iconType: 'academy' },
    { num: 2, title: 'DFA vs NFA', desc: 'Side-by-side comparison matrix evaluating transition functions and graph complexity.', time: '8 mins', difficulty: 'Beginner', iconType: 'box' },
    { num: 3, title: 'Components of an NFA', desc: 'Visual highlighter map detailing states, alphabets, entrance, and final rings.', time: '6 mins', difficulty: 'Beginner', iconType: 'play' },
    { num: 4, title: 'Multiple Transitions', desc: 'Animation explorer demonstrating parallel path traversal split on single inputs.', time: '8 mins', difficulty: 'Intermediate', iconType: 'settings' },
    { num: 5, title: 'Acceptance of Strings', desc: 'Step-by-step branching path analyzer highlighting winning routes.', time: '10 mins', difficulty: 'Intermediate', iconType: 'code' },
    { num: 6, title: 'Interactive Example', desc: 'Live execution simulation testing customized binary input words.', time: '12 mins', difficulty: 'Advanced', iconType: 'trophy' },
    { num: 7, title: 'Quick Quiz', desc: 'Graduation quiz testing concepts with instant explanations and coins.', time: '15 mins', difficulty: 'Advanced', iconType: 'trophy' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="av-tab-transition">
      
      {/* ---------------- SECTION: ACADEMY HUB ---------------- */}
      {activeSection === 'HUB' && (
        <div className="animate-scale-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Hero Banner Card */}
          <div className="academy-header-card" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffc857', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Chapter 2: Non-Determinism
              </span>
              <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: '4px' }}>
                Master Non-Deterministic Finite Automata
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.45 }}>
                Learn how computation paths split, master subset construction, and convert standard NFA structures to DFA equivalences.
              </p>
            </div>

            <div className="academy-progress-wrapper" style={{ minWidth: '220px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '24px' }}>
              <div className="academy-progress-text">
                <span>Course Progress</span>
                <span>{currentProgressPercent}% Complete</span>
              </div>
              <div className="academy-progress-bar-bg" style={{ height: '6px', marginTop: '4px' }}>
                <div className="academy-progress-bar-fill" style={{ width: `${currentProgressPercent}%` }} />
              </div>
            </div>
          </div>

          {/* Continue Journey Quick Card */}
          <Card glass style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--accent-warning)', fontWeight: 700, textTransform: 'uppercase' }}>Continue Journey</span>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>
                {completedChapters.length === 7 ? 'Course Completed!' : `Next Chapter: ${syllabus[completedChapters.length]?.title}`}
              </h4>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {completedChapters.length === 7 ? 'Solve speed rounds or challenge maps to practice.' : 'Resume where you left off to gain bonus experience points.'}
              </p>
            </div>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => handleChapterSelect(completedChapters.length === 7 ? 1 : completedChapters.length + 1)} 
              glow
            >
              {completedChapters.length === 7 ? 'Review Course' : `Resume Chapter ${completedChapters.length + 1}`}
            </Button>
          </Card>

          {/* Navigation Deck Grid */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>Select Training Deck</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              {[
                {
                  id: 'learn-nfa',
                  badge: 'Course',
                  meta: '7 Chapters',
                  badgeClass: 'lesson-badge',
                  icon: <AcademyIcon size={16} />,
                  title: 'Learn NFA',
                  subtitle: 'Interactive course module',
                  desc: 'Master active subset state traces, transitions, and powerset conversions with simulator sandboxes.',
                  onClick: () => {
                    setActiveChapter(null);
                    setActiveSection('LEARN');
                  }
                },
                {
                  id: 'practice-arena',
                  badge: 'Arena',
                  meta: 'Practice sets',
                  badgeClass: 'lesson-badge advanced',
                  icon: <BoxIcon size={16} />,
                  title: 'Practice Arena',
                  subtitle: 'Solve NFA questions',
                  desc: 'Solve automatically randomized NFA transitions rules and test binary validations.',
                  onClick: () => {
                    setActiveSection('PRACTICE');
                    resetPractice();
                  }
                },
                {
                  id: 'nfa-simulator',
                  badge: 'Sandbox',
                  meta: 'Drag & Drop',
                  badgeClass: 'lesson-badge',
                  icon: <PlayIcon size={16} />,
                  title: 'NFA Simulator',
                  subtitle: 'Interactive canvas',
                  desc: 'Open the vector canvas workspace to draw states, paths, and trace parallel state subsets.',
                  onClick: () => {
                    setActiveTab('canvas');
                  }
                },
                {
                  id: 'speed-challenge',
                  badge: 'Timed',
                  meta: '60s Clock',
                  badgeClass: 'lesson-badge advanced',
                  icon: <CodeIcon size={16} />,
                  title: 'Speed Challenge',
                  subtitle: 'Fast quiz round',
                  desc: 'Race against the clock, validating regular expressions and state subsets under pressure.',
                  onClick: () => {
                    setActiveTab('activity');
                  }
                },
                {
                  id: 'statistics',
                  badge: 'Metrics',
                  meta: 'Live tracking',
                  badgeClass: 'lesson-badge',
                  icon: <SettingsIcon size={16} />,
                  title: 'Statistics',
                  subtitle: 'Learning profiles',
                  desc: 'Review exercise accuracy, daily cognitive strength audit charts, and sustained learning streaks.',
                  onClick: () => {
                    setActiveSection('STATS');
                  }
                },
                {
                  id: 'question-bank',
                  badge: 'Database',
                  meta: 'All questions',
                  badgeClass: 'lesson-badge',
                  icon: <TrophyIcon size={16} />,
                  title: 'Question Bank',
                  subtitle: 'Query and preview',
                  desc: 'Central repository to filter, bookmark, search, and review all NFA practice questions.',
                  onClick: () => {
                    setActiveSection('BANK');
                  }
                }
              ].map((card) => {
                return (
                  <Card 
                    key={card.id}
                    glass 
                    className="lesson-card-interactive"
                    style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer' }}
                    onClick={() => {
                      card.onClick();
                    }}
                  >
                    <div className="lesson-badge-row">
                      <span className={card.badgeClass}>{card.badge}</span>
                      <span className="lesson-meta-text">{card.meta}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div className="feature-icon-box" style={{ width: '34px', height: '34px' }}>{card.icon}</div>
                      <div>
                        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>{card.title}</h3>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{card.subtitle}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      {card.desc}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ---------------- SECTION: LEARN NFA CHAPTERS ---------------- */}
      {activeSection === 'LEARN' && activeChapter === null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="av-tab-transition">
          {/* Hero Banner Card */}
          <div className="academy-header-card" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffc857', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Course Syllabus
              </span>
              <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em', marginTop: '4px' }}>
                NFA Academy
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.45 }}>
                Master active subset state traces, transitions, and powerset conversions with simulator sandboxes. Progress is saved locally.
              </p>
            </div>

            <div className="academy-progress-wrapper" style={{ minWidth: '220px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '24px' }}>
              <div className="academy-progress-text">
                <span>Course Completion</span>
                <span>{currentProgressPercent}% Complete</span>
              </div>
              <div className="academy-progress-bar-bg" style={{ height: '6px', marginTop: '4px' }}>
                <div className="academy-progress-bar-fill" style={{ width: `${currentProgressPercent}%` }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>Interactive Chapters</h3>
            <Button variant="outline" size="sm" onClick={() => setActiveSection('HUB')}>
              ← Return to Hub
            </Button>
          </div>

          {/* Grid Overview of Lessons */}
          <div className="academy-grid">
            {syllabus.map((lesson) => {
              const isCompleted = completedChapters.includes(lesson.num);
              
              return (
                <LessonCard
                  key={lesson.num}
                  id={lesson.num}
                  title={lesson.title}
                  desc={lesson.desc}
                  time={lesson.time || '5 mins'}
                  difficulty={lesson.difficulty || 'Beginner'}
                  iconType={lesson.iconType || 'academy'}
                  isCompleted={isCompleted}
                  onClick={() => handleChapterSelect(lesson.num)}
                />
              );
            })}
          </div>
        </div>
      )}

      {activeSection === 'LEARN' && activeChapter !== null && (
        <div className="animate-scale-in" style={{ display: 'flex', gap: '24px', flex: 1 }}>
          
          {/* Left Course Sidebar: Chapter list */}
          <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '12px', borderRight: '1px solid var(--border-subtle)', paddingRight: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>Course Syllabus</span>
              <Button variant="outline" size="sm" onClick={() => setActiveChapter(null)}>
                ← Overview
              </Button>
            </div>

            {syllabus.map((ch) => {
              const isCompleted = completedChapters.includes(ch.num);
              const isUnlocked = ch.num === 1 || completedChapters.includes(ch.num - 1);
              const isActive = activeChapter === ch.num;

              return (
                <div 
                  key={ch.num}
                  onClick={() => handleChapterSelect(ch.num)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    background: isActive ? 'rgba(61,235,255,0.06)' : 'rgba(255,255,255,0.01)',
                    border: isActive ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    cursor: isUnlocked ? 'pointer' : 'not-allowed',
                    opacity: isUnlocked ? 1 : 0.5,
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: isActive ? 'var(--accent-cyan)' : 'var(--text-dimmed)' }}>
                      CHAPTER {ch.num}
                    </span>
                    <span style={{ fontSize: '11px' }}>
                      {isCompleted ? '✅' : isUnlocked ? '🔓' : '🔒'}
                    </span>
                  </div>
                    <h4 style={{ fontSize: '13px', fontWeight: 600, color: isActive ? 'var(--text-main)' : 'var(--text-muted)' }}>{ch.title}</h4>
                </div>
              );
            })}
          </div>

          {/* Right Area: Chapter Details & Animations */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Card glass style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>Chapter {activeChapter} of 7</span>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                    {syllabus[activeChapter - 1].title}
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ⏱️ <span style={{ fontSize: '11px', color: 'var(--text-dimmed)', fontFamily: 'var(--font-mono)' }}>3-5 min content</span>
                </div>
              </div>

              {/* Text explanations */}
              <div style={{ fontSize: '13.5px', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {activeChapter === 1 && (
                  `Non-Deterministic Finite Automata (NFA) are state-machine models designed to solve string validation. Unlike a DFA where every single state has exactly one arrow pointing out for each input symbol, an NFA is highly flexible.

Key Characteristics:
• Branching: A state can transition to multiple states on a single symbol.
• Partial States: Some states can lack transition paths on characters (this acts as a dead-end).
• Parallel Traversal: The machine automatically clones execution paths, evaluating all choices at once!

Real-World Analogy:
"A DFA is like walking down a straight maze where each fork has strict signposts. An NFA is like having a replication spell: at each fork, you clone yourself and explore all paths simultaneously!"`
                )}
                {activeChapter === 2 && (
                  `Before moving forward, let's understand the mathematical and design contrasts between Deterministic (DFA) and Non-Deterministic (NFA) finite automata.`
                )}
                {activeChapter === 3 && (
                  `An NFA is mathematically specified by the exact same 5-tuple structure as a DFA: M = (Q, Σ, δ, q0, F).
                  
Select a tuple element below to highlight its role in the diagram:`
                )}
                {activeChapter === 4 && (
                  `When an input character is processed in an NFA, if a state has multiple outgoing transitions mapped to that character, the machine splits the computation thread.
                  
The automaton exists in multiple states simultaneously! Below, you can see how reading the symbol '1' triggers branches to both q0 and q1 at once.`
                )}
                {activeChapter === 5 && (
                  `How does an NFA successfully accept a string?
                  
Because execution splits into a tree of computation pathways, we evaluate string acceptance at the termination of the input string:
• The string is ACCEPTED if at least one computation branch lands in a double-circled final state.
• The string is REJECTED only if all active branches fail to end in a final state.`
                )}
                {activeChapter === 6 && (
                  `Now try tracing transitions yourself. Type in a binary string below and watch the states branch in parallel inside this 3-state NFA:`
                )}
                {activeChapter === 7 && (
                  `Test your understanding of Non-Deterministic Finite Automata. Complete this quick 10-question graduation quiz to gain XP points and Coins!`
                )}
              </div>

              {/* Diagrams & Sandbox Demos based on active chapters */}
              {activeChapter === 1 && <ChapterOneDemo showToast={showToast} />}
              {activeChapter === 2 && <ChapterTwoDemo />}
              {activeChapter === 3 && <ChapterThreeDemo />}
              {activeChapter === 4 && <ChapterFourDemo />}
              {activeChapter === 5 && <ChapterFiveDemo />}
              {activeChapter === 6 && <ChapterSixDemo showToast={showToast} />}
              {activeChapter === 7 && (
                <ChapterSevenQuiz 
                  awardRewards={awardRewards} 
                  showToast={showToast} 
                  onQuizComplete={() => {
                    if (!completedChapters.includes(7)) {
                      setCompletedChapters((prev) => [...prev, 7]);
                    }
                    setActiveSection('HUB');
                  }} 
                />
              )}

              {/* Navigation button panel (hidden on quiz to enforce submission) */}
              {activeChapter !== 7 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                  <Button variant="secondary" size="md" onClick={() => (activeChapter !== null && activeChapter > 1) ? setActiveChapter(activeChapter - 1) : setActiveSection('HUB')}>
                    {activeChapter === 1 ? 'Back to Hub' : 'Previous Chapter'}
                  </Button>
                  <Button variant="primary" size="md" onClick={handleChapterComplete} glow>
                    {completedChapters.includes(activeChapter) ? 'Next Chapter →' : 'Complete Chapter ✨'}
                  </Button>
                </div>
              )}

            </Card>
          </div>

        </div>
      )}

      {/* ---------------- SECTION: NFA PRACTICE MODE ---------------- */}
      {activeSection === 'PRACTICE' && (
        <div className="animate-scale-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
          
          {/* Practice Hub / Home Selection Screen */}
          {practiceDifficulty === null ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>NFA Practice Arena</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Choose a difficulty deck to test your Non-Deterministic trace capabilities.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select 
                    value={practiceTypeFilter} 
                    onChange={(e) => setPracticeTypeFilter(e.target.value as any)}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '4px', fontSize: '12.5px' }}
                  >
                    <option value="All">Filter: All Types</option>
                    <option value="Identify">Identify Strings</option>
                    <option value="Trace">Trace Executions</option>
                    <option value="Convert">NFA to DFA</option>
                  </select>
                  <Button variant="outline" size="sm" onClick={() => setActiveSection('HUB')}>
                    ← Back to Hub
                  </Button>
                </div>
              </div>

              {/* Difficulty Cards Deck */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                {[
                  { diff: 'Easy', time: '3 mins', questions: 3, xp: 60, color: 'var(--accent-success)', glowColor: 'rgba(16,185,129,0.15)' },
                  { diff: 'Medium', time: '5 mins', questions: 3, xp: 90, color: 'var(--accent-cyan)', glowColor: 'var(--accent-cyan-glow)' },
                  { diff: 'Hard', time: '8 mins', questions: 2, xp: 80, color: 'var(--accent-purple)', glowColor: 'var(--accent-purple-glow)' },
                  { diff: 'Mixed', time: '10 mins', questions: 8, xp: 230, color: 'var(--accent-warning)', glowColor: 'rgba(255,200,87,0.15)' }
                ].map((deck) => {
                  const best = practiceBestScores[deck.diff] || 0;
                  const pct = best > 0 ? 100 : 0;
                  
                  return (
                    <Card 
                      key={deck.diff}
                      glass
                      className="lesson-card-interactive"
                      style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer', borderColor: deck.glowColor, boxShadow: `0 8px 32px rgba(0,0,0,0.2), 0 0 8px ${deck.glowColor}` }}
                      onClick={() => startPracticeSession(deck.diff as any)}
                    >
                      <div>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: deck.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          Difficulty
                        </span>
                        <h3 style={{ fontSize: '20px', fontWeight: 800, marginTop: '2px', color: 'var(--text-main)' }}>{deck.diff} Challenge</h3>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Questions</span>
                          <strong style={{ color: 'var(--text-main)' }}>{deck.questions} items</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Time Limit</span>
                          <strong style={{ color: 'var(--text-main)' }}>{deck.time}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>XP Reward</span>
                          <strong style={{ color: deck.color }}>+{deck.xp} XP</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Best Score</span>
                          <strong style={{ color: 'var(--text-main)' }}>{best}/{deck.questions}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>
                          <span>Completion</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="academy-progress-bar-bg" style={{ height: '4px' }}>
                          <div className="academy-progress-bar-fill" style={{ width: `${pct}%`, background: deck.color }} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

            </div>
          ) : !practiceShowSummary ? (
            /* active question panel */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button variant="outline" size="sm" onClick={resetPractice}>
                  ← Back to Selection
                </Button>
                <div style={{ fontSize: '12.5px', color: 'var(--text-dimmed)', fontFamily: 'var(--font-mono)' }}>
                  Session Duration: ⏱️ {formatTime(practiceElapsedTime)}
                </div>
              </div>

              {practiceQuestions.length > 0 ? (
                (() => {
                  const q = practiceQuestions[practiceQIdx];
                  const hasBookmarked = practiceBookmarks.includes(q.id);
                  const isWrongAttempt = practiceAttemptCount === 1;

                  return (
                    <Card 
                      glass 
                      style={{ 
                        padding: '24px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '20px', 
                        border: practiceIsAnswered 
                          ? (practiceSelectedOpt === q.correctIndex ? '2px solid var(--accent-success)' : '2px solid var(--accent-error)')
                          : isWrongAttempt ? '2px solid var(--accent-warning)' : '1px solid var(--border-subtle)',
                        boxShadow: practiceIsAnswered && practiceSelectedOpt === q.correctIndex ? '0 0 16px rgba(16,185,129,0.15)' : 'none',
                        transition: 'all 0.25s'
                      }}
                      className="animate-scale-in"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
                            Question {practiceQIdx + 1} of {practiceQuestions.length}
                          </span>
                          <span className="lesson-badge" style={{ marginLeft: '12px', background: 'rgba(255,200,87,0.06)', color: '#FFC857', border: '1px solid rgba(255,200,87,0.15)' }}>
                            {q.difficulty}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleToggleBookmark(q.id)}
                            style={{ background: 'none', border: 'none', color: hasBookmarked ? 'var(--accent-warning)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '14px' }}
                          >
                            {hasBookmarked ? '★ Bookmarked' : '☆ Bookmark'}
                          </button>
                        </div>
                      </div>

                      {/* Question progress bar */}
                      <div className="academy-progress-bar-bg" style={{ height: '4px', marginTop: '-12px' }}>
                        <div className="academy-progress-bar-fill" style={{ width: `${Math.round(((practiceQIdx) / practiceQuestions.length) * 100)}%` }} />
                      </div>

                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.45 }}>{q.question}</h3>

                      {/* Render Interactive NFA Diagram if appropriate */}
                      {q.hasDiagram && (
                        <div style={{ display: 'flex', justifyContent: 'center', background: 'var(--bg-panel)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                          <svg width="280" height="90" viewBox="0 0 280 90">
                            <defs>
                              <marker id="prac-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--graph-arrow)" />
                              </marker>
                            </defs>

                            {/* Start Arrow */}
                            <path d="M 15 45 L 40 45" stroke="var(--graph-start-arrow)" strokeWidth="1.5" fill="none" markerEnd="url(#prac-arrow)" />
                            <text x="25" y="38" fontSize="9" fontFamily="var(--font-mono)" fill="var(--text-muted)" fontWeight="bold" textAnchor="middle">Start</text>

                            {/* Transition Path */}
                            <path d="M 78 45 L 180 45" stroke="var(--graph-edge)" strokeWidth="1.5" fill="none" markerEnd="url(#prac-arrow)" />
                            <text x="130" y="34" fill="var(--accent-cyan)" fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold" stroke="var(--graph-label-bg)" strokeWidth="3" paintOrder="stroke" textAnchor="middle">1</text>

                            {/* Self Loop */}
                            <path d="M 47 34 C 20 15, 20 75, 47 56" stroke="var(--graph-edge)" strokeWidth="1.5" fill="none" markerEnd="url(#prac-arrow)" />
                            <text x="20" y="49" fill="var(--graph-label-text)" fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold" stroke="var(--graph-label-bg)" strokeWidth="3" paintOrder="stroke" textAnchor="middle">0</text>

                            {/* Node q0 */}
                            <circle cx="60" cy="45" r="18" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="1.5" />
                            <text x="60" y="49" textAnchor="middle" fill="var(--text-main)" fontSize="11" fontWeight="bold">q0</text>

                            {/* Node q1 */}
                            <circle cx="200" cy="45" r="18" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="1.5" />
                            <circle cx="200" cy="45" r="15" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" />
                            <text x="200" y="49" textAnchor="middle" fill="var(--text-main)" fontSize="11" fontWeight="bold">q1</text>
                          </svg>
                        </div>
                      )}

                      {/* Options stack */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {q.options.map((opt, oIdx) => {
                          const isSelected = practiceSelectedOpt === oIdx;
                          const isCorrect = oIdx === q.correctIndex;
                          
                          let btnBorder = '1.5px solid var(--border-medium)';
                          let btnBg = 'rgba(255,255,255,0.01)';

                          if (isSelected) {
                            btnBorder = '1.5px solid var(--accent-cyan)';
                            btnBg = 'rgba(61,235,255,0.06)';
                          }

                          if (practiceIsAnswered) {
                            if (isCorrect) {
                              btnBorder = '2px solid var(--accent-success)';
                              btnBg = 'rgba(16,185,129,0.12)';
                            } else if (isSelected) {
                              btnBorder = '2px solid var(--accent-error)';
                              btnBg = 'rgba(239,68,68,0.12)';
                            }
                          }

                          return (
                            <button 
                              key={oIdx}
                              onClick={() => !practiceIsAnswered && setPracticeSelectedOpt(oIdx)}
                              disabled={practiceIsAnswered}
                              style={{
                                textAlign: 'left',
                                padding: '12px 16px',
                                borderRadius: '6px',
                                border: btnBorder,
                                background: btnBg,
                                color: 'var(--text-main)',
                                fontSize: '13px',
                                cursor: practiceIsAnswered ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                              }}
                            >
                              <span style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                border: isSelected ? '4px solid var(--accent-cyan)' : '1.5px solid var(--border-strong)',
                                display: 'inline-block'
                              }} />
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {/* Hint card */}
                      {practiceShowHint && (
                        <div style={{ padding: '12px', background: 'rgba(61,235,255,0.04)', border: '1px solid rgba(61,235,255,0.15)', borderRadius: '6px', fontSize: '12.5px', color: 'var(--accent-cyan)' }}>
                          💡 <strong>Hint:</strong> {q.hint}
                        </div>
                      )}

                      {/* Answer explanations */}
                      {practiceIsAnswered && (
                        <div style={{ background: 'rgba(255,200,87,0.05)', border: '1px solid rgba(255,200,87,0.2)', padding: '12px', borderRadius: '6px', fontSize: '12.5px', color: '#FFC857', lineHeight: 1.45 }}>
                          <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}

                      {/* Footer Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button variant="outline" size="sm" onClick={() => setPracticeShowHint(true)}>
                            Hint
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => setPracticeSelectedOpt(null)} disabled={practiceIsAnswered}>
                            Reset
                          </Button>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button variant="secondary" size="sm" onClick={handlePracticeSkip} disabled={practiceIsAnswered}>
                            Skip
                          </Button>
                          {!practiceIsAnswered ? (
                            <Button variant="primary" size="md" onClick={handlePracticeSubmit} disabled={practiceSelectedOpt === null}>
                              {isWrongAttempt ? 'Submit Retry' : 'Submit Answer'}
                            </Button>
                          ) : (
                            <Button variant="primary" size="md" onClick={handlePracticeNext} glow>
                              {practiceQIdx === practiceQuestions.length - 1 ? 'Finish Session' : 'Next Question →'}
                            </Button>
                          )}
                        </div>
                      </div>

                    </Card>
                  );
                })()
              ) : (
                <Card glass style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No questions match the selected filter.
                </Card>
              )}

            </div>
          ) : (
            /* celebrating summary viewport */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-scale-in">
              <Card glass style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', borderColor: 'var(--accent-success)', boxShadow: '0 0 32px rgba(16,185,129,0.15)' }}>
                <div style={{ fontSize: '48px' }}>🏆</div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--accent-success)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    Practice Completed
                  </span>
                  <h2 style={{ fontSize: '28px', color: 'var(--text-main)', marginTop: '6px' }}>Session Graduates!</h2>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.45 }}>
                    You have successfully navigated the <strong>{practiceDifficulty} Challenge</strong> path.
                  </p>
                </div>

                {/* Animated Stats Card Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', width: '100%', maxWidth: '600px', marginTop: '12px' }}>
                  
                  <div style={{ background: 'var(--bg-hover)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dimmed)', textTransform: 'uppercase' }}>Accuracy</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '6px' }}>
                      {Math.round((practiceCorrectCount / practiceQuestions.length) * 100)}%
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{practiceCorrectCount}/{practiceQuestions.length} Correct</span>
                  </div>

                  <div style={{ background: 'var(--bg-hover)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dimmed)', textTransform: 'uppercase' }}>Rewards</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFC857', marginTop: '6px' }}>
                      🪙 +25
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--accent-success)' }}>+100 XP gained</span>
                  </div>

                  <div style={{ background: 'var(--bg-hover)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dimmed)', textTransform: 'uppercase' }}>Time Spent</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                      ⏱️ {formatTime(practiceElapsedTime)}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Completion track</span>
                  </div>

                  <div style={{ background: 'var(--bg-hover)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dimmed)', textTransform: 'uppercase' }}>Max Streak</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '6px' }}>
                      🔥 {practiceBestStreak}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Consecutive correct</span>
                  </div>

                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <Button variant="secondary" size="md" onClick={retryIncorrectQuestions}>
                    🔄 Retry Incorrect
                  </Button>
                  <Button variant="primary" size="md" onClick={resetPractice} glow>
                    Return to Selection
                  </Button>
                </div>
              </Card>
            </div>
          )}

        </div>
      )}

      {/* ---------------- SECTION: HUB STATISTICS ---------------- */}
      {activeSection === 'STATS' && (
        <div className="animate-scale-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>Statistics & Analytics</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Real-time evaluation of your NFA conceptual progress and simulator traces.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveSection('HUB')}>
              ← Back to Hub
            </Button>
          </div>

          {/* ================= OVERVIEW SECTION ================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Total Practice', val: '8 sessions', icon: '📝', color: 'var(--accent-cyan)' },
              { label: 'Challenges Run', val: '4 rounds', icon: '🏆', color: 'var(--accent-purple)' },
              { label: 'Questions Attempted', val: '34 items', icon: '👁️', color: 'var(--text-main)' },
              { label: 'Correct Answers', val: '28 items', icon: '✨', color: 'var(--accent-success)' },
              { label: 'Overall Accuracy', val: '82%', icon: '🎯', color: 'var(--accent-cyan)' },
              { label: 'Total XP Earned', val: '+480 XP', icon: '💎', color: 'var(--accent-warning)' },
              { label: 'Coins Accumulated', val: '🪙 75', icon: '🪙', color: '#ffc857' },
              { label: 'Longest Streak', val: '🔥 6 Streak', icon: '🔥', color: 'var(--accent-error)' }
            ].map((card, idx) => (
              <Card 
                key={idx} 
                glass 
                style={{ 
                  padding: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '6px',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'default'
                }}
                className="lesson-card-interactive"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-dimmed)', fontWeight: 700, textTransform: 'uppercase' }}>{card.label}</span>
                  <span style={{ fontSize: '16px' }}>{card.icon}</span>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: card.color, marginTop: '4px' }} className="animate-scale-in">
                  {card.val}
                </div>
              </Card>
            ))}
          </div>

          {/* ================= PERFORMANCE ANALYTICS (SVG CHARTS) ================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '20px' }}>
            
            {/* Line Chart: Accuracy Over Time */}
            <Card glass style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>Accuracy Progress Trend</span>
              <div style={{ height: '140px', width: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', paddingTop: '10px' }}>
                <svg width="100%" height="100%" viewBox="0 0 300 120" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="300" y2="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                  <line x1="0" y1="60" x2="300" y2="60" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                  <line x1="0" y1="90" x2="300" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                  
                  {/* Shaded Area */}
                  <path d="M 0 120 L 0 90 L 75 75 L 150 45 L 225 35 L 300 20 L 300 120 Z" fill="url(#chart-grad)" />
                  {/* Trend Line */}
                  <path d="M 0 90 L 75 75 L 150 45 L 225 35 L 300 20" fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 0 4px var(--accent-cyan-glow))' }} />
                  
                  {/* Plot Dots */}
                  <circle cx="0" cy="90" r="4" fill="#fff" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                  <circle cx="75" cy="75" r="4" fill="#fff" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                  <circle cx="150" cy="45" r="4" fill="#fff" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                  <circle cx="225" cy="35" r="4" fill="#fff" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                  <circle cx="300" cy="20" r="4" fill="#fff" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                </svg>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dimmed)' }}>
                <span>Session 1 (60%)</span>
                <span>Session 3 (75%)</span>
                <span>Session 5 (90%)</span>
              </div>
            </Card>

            {/* Bar Chart: Solved Questions per Day */}
            <Card glass style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase' }}>Daily Cognitive Strength</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '140px', padding: '0 10px 10px 10px' }}>
                {[
                  { label: 'Mon', h: '35%' },
                  { label: 'Tue', h: '60%' },
                  { label: 'Wed', h: '85%' },
                  { label: 'Thu', h: '50%' },
                  { label: 'Fri', h: '95%' }
                ].map((bar, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <div style={{ width: '14px', height: '110px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', display: 'flex', alignItems: 'flex-end' }}>
                      <div 
                        style={{ 
                          width: '100%', 
                          height: bar.h, 
                          background: 'linear-gradient(0deg, var(--accent-purple), var(--accent-cyan))', 
                          borderRadius: '4px',
                          boxShadow: '0 0 8px rgba(123,97,255,0.3)',
                          transition: 'height 0.8s ease-out'
                        }} 
                      />
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-dimmed)' }}>{bar.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Donut Chart: Attempts Ratio */}
            <Card glass style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffc857', textTransform: 'uppercase' }}>Practice vs Challenge attempts</span>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '140px' }}>
                <svg width="120" height="120" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                  {/* Practice Slice (70%) */}
                  <circle cx="20" cy="20" r="15.915" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
                  <circle 
                    cx="20" cy="20" r="15.915" fill="none" 
                    stroke="var(--accent-cyan)" strokeWidth="4" 
                    strokeDasharray="70 30" strokeDashoffset="0" 
                  />
                  {/* Challenge Slice (30%) */}
                  <circle 
                    cx="20" cy="20" r="15.915" fill="none" 
                    stroke="var(--accent-purple)" strokeWidth="4" 
                    strokeDasharray="30 70" strokeDashoffset="-70" 
                  />
                </svg>
                <div style={{ marginLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />
                    <span>Practice: <strong>70%</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-purple)' }} />
                    <span>Challenge: <strong>30%</strong></span>
                  </div>
                </div>
              </div>
            </Card>

          </div>

          {/* ================= TOPIC PERFORMANCE ================= */}
          <Card glass style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Topic Mastery Index</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { name: 'NFA Basics', acc: 95, att: 10, sugg: 'Mastered. Ready for complex state models.' },
                { name: 'State Transitions', acc: 85, att: 8, sugg: 'Stable tracing. Try 2 more quiz questions.' },
                { name: 'Accepted Strings', acc: 75, att: 6, sugg: 'Watch out for parallel dead-end branches.' },
                { name: 'Rejected Strings', acc: 60, att: 4, sugg: 'Focus on states lacking transition definitions.' },
                { name: 'NFA to DFA Conversion', acc: 50, att: 6, sugg: 'Review Subset construction mapping rules.' }
              ].map((topic, idx) => {
                const isGreen = topic.acc >= 80;
                const isYellow = topic.acc >= 50 && topic.acc < 80;
                const color = isGreen ? 'var(--accent-success)' : isYellow ? 'var(--accent-warning)' : 'var(--accent-error)';
                
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{topic.name}</span>
                      <span style={{ color: color, fontWeight: 700 }}>{topic.acc}% Accuracy ({topic.att} attempted)</span>
                    </div>
                    <div className="academy-progress-bar-bg" style={{ height: '5px' }}>
                      <div className="academy-progress-bar-fill" style={{ width: `${topic.acc}%`, background: color }} />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>💡 {topic.sugg}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ================= PERSONAL BESTS & RECOMMENDATIONS ================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            <Card glass style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>🏆 Personal Records</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Highest Challenge Score</span>
                  <strong style={{ color: 'var(--text-main)' }}>280 Points</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Fastest Chapter Quiz</span>
                  <strong style={{ color: 'var(--text-main)' }}>1:45 mins</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Longest Streak</span>
                  <strong style={{ color: 'var(--text-main)' }}>🔥 6 Correct</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Daily multiplier bonus</span>
                  <strong style={{ color: 'var(--accent-warning)' }}>x1.5 Multiplier</strong>
                </div>
              </div>
            </Card>

            <Card glass style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase' }}>🚀 Path Recommendations</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                  <span>🎯</span>
                  <span>Solve 3 more <strong>NFA to DFA Conversion</strong> sandbox tables.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                  <span>⚔️</span>
                  <span>Attempt the <strong>Mixed NFA Practice</strong> challenge rounds.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                  <span>🔍</span>
                  <span>Retry incorrect transition questions to recover lost streaks.</span>
                </div>
              </div>
            </Card>

          </div>

          {/* ================= RECENT ACTIVITY ================= */}
          <Card glass style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recent History Logs</span>
              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-hover)', padding: '2px', borderRadius: '4px' }}>
                {['Today', 'This Week', 'All Time'].map((tab) => (
                  <button 
                    key={tab} 
                    style={{ background: tab === 'Today' ? 'var(--bg-active)' : 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '10.5px', padding: '3px 8px', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse', color: 'var(--text-main)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '6px' }}>Activity Type</th>
                  <th style={{ padding: '6px' }}>Score / Result</th>
                  <th style={{ padding: '6px' }}>XP Gained</th>
                  <th style={{ padding: '6px' }}>Date Completed</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Subset construction sandbox', result: '3/3 Correct', xp: '+30 XP', date: '2026-07-25 (Today)' },
                  { name: 'Standard NFA Practice Arena', result: '8/10 Correct', xp: '+80 XP', date: '2026-07-24' },
                  { name: 'NFA Basics Chapter Quiz', result: '5/5 Correct', xp: '+50 XP', date: '2026-07-22' }
                ].map((act, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '8px 6px', fontWeight: 500 }}>{act.name}</td>
                    <td style={{ padding: '8px 6px', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{act.result}</td>
                    <td style={{ padding: '8px 6px', color: 'var(--accent-success)' }}>{act.xp}</td>
                    <td style={{ padding: '8px 6px', color: 'var(--text-muted)' }}>{act.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* ================= ACHIEVEMENTS ================= */}
          <Card glass style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Academic Achievements</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              {[
                { name: 'First Practice Completed', desc: 'Finished initial Arena set.', unlocked: true, icon: '🌟', color: 'var(--accent-cyan)' },
                { name: 'Perfect Score', desc: 'Score 100% on any chapter quiz.', unlocked: true, icon: '🏆', color: '#ffc857' },
                { name: 'Conversion Expert', desc: 'First subset conversion table.', unlocked: true, icon: '⚡', color: 'var(--accent-purple)' },
                { name: '50 Correct answers', desc: 'Identify 50 valid states.', unlocked: false, icon: '🔒', color: 'gray' },
                { name: '100 Correct answers', desc: 'Graduated 100 trace paths.', unlocked: false, icon: '🔒', color: 'gray' },
                { name: 'NFA Master Badge', desc: 'Achieved 100% course graduation.', unlocked: false, icon: '🔒', color: 'gray' }
              ].map((ach, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '12px', 
                    borderRadius: '6px', 
                    border: '1px solid var(--border-subtle)', 
                    background: ach.unlocked ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.2)', 
                    opacity: ach.unlocked ? 1 : 0.45,
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    textAlign: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '20px', filter: ach.unlocked ? 'none' : 'grayscale(100%)' }}>{ach.icon}</span>
                  <strong style={{ fontSize: '11.5px', color: ach.unlocked ? '#fff' : 'var(--text-muted)', marginTop: '4px' }}>{ach.name}</strong>
                  <span style={{ fontSize: '10px', color: 'var(--text-dimmed)' }}>{ach.desc}</span>
                </div>
              ))}
            </div>
          </Card>

        </div>
      )}

      {/* ---------------- SECTION: QUESTION BANK ---------------- */}
      {activeSection === 'BANK' && (() => {
        // Filter logic
        const filteredQuestions = PRACTICE_QUESTIONS.filter((q) => {
          // Search keyword
          const matchesKeyword = q.question.toLowerCase().includes(qBankSearch.toLowerCase()) || 
                                 q.title.toLowerCase().includes(qBankSearch.toLowerCase());
          
          // Category
          const matchesCategory = qBankCategory === 'All' || q.category === qBankCategory;
          
          // Difficulty
          const matchesDifficulty = qBankDifficulty === 'All' || q.difficulty === qBankDifficulty;
          
          // Type
          const matchesType = qBankType === 'All' || q.type === qBankType;
          
          // Status filters (Solved, Unsolved, Bookmarked, Incorrect)
          const isBookmarked = qBankBookmarks.includes(q.id);
          const isSolved = (qBankCorrects[q.id] || 0) > 0;
          const isIncorrect = (qBankAttempts[q.id] || 0) > 0 && !isSolved;
          
          let matchesStatus = true;
          if (qBankFilterStatus === 'Bookmarked') matchesStatus = isBookmarked;
          else if (qBankFilterStatus === 'Solved') matchesStatus = isSolved;
          else if (qBankFilterStatus === 'Unsolved') matchesStatus = !isSolved;
          else if (qBankFilterStatus === 'Incorrect') matchesStatus = isIncorrect;

          return matchesKeyword && matchesCategory && matchesDifficulty && matchesType && matchesStatus;
        });

        const selectedQ = PRACTICE_QUESTIONS.find((q) => q.id === selectedQBankId) || PRACTICE_QUESTIONS[0];
        const isSelectedBookmarked = qBankBookmarks.includes(selectedQ.id);

        const toggleBookmark = (id: number) => {
          setQBankBookmarks((prev) => 
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
          );
        };

        // Custom practice launcher with filtered question set
        const startCustomPractice = () => {
          if (filteredQuestions.length === 0) {
            alert('No questions match the current filters to start a session!');
            return;
          }
          // Shuffle matching questions to avoid duplicate streaks
          const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
          setPracticeQuestions(shuffled);
          setPracticeDifficulty('Mixed');
          setPracticeQIdx(0);
          setPracticeSelectedOpt(null);
          setPracticeIsAnswered(false);
          setPracticeAttemptCount(0);
          setPracticeCorrectCount(0);
          setPracticeElapsedTime(0);
          setPracticeStreak(0);
          setPracticeBestStreak(0);
          setPracticeShowHint(false);
          setPracticeShowSummary(false);
          setActiveSection('PRACTICE');
        };

        return (
          <div className="animate-scale-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>Question Bank Central Repository</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Browse categories, test tracing statements, and launch custom filtered NFA sets.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" size="sm" onClick={() => setActiveSection('HUB')}>
                  ← Back to Hub
                </Button>
              </div>
            </div>

            {/* Filter Deck */}
            <Card glass style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                
                {/* Search */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-dimmed)', fontWeight: 700 }}>Search Keyword</label>
                  <input 
                    type="text" 
                    placeholder="Search query..." 
                    value={qBankSearch} 
                    onChange={(e) => setQBankSearch(e.target.value)} 
                    style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', padding: '6px 10px', borderRadius: '4px', fontSize: '13px' }}
                  />
                </div>

                {/* Category filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-dimmed)', fontWeight: 700 }}>Filter Category</label>
                  <select 
                    value={qBankCategory} 
                    onChange={(e) => setQBankCategory(e.target.value)} 
                    style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px', fontSize: '13px' }}
                  >
                    <option value="All">All Categories</option>
                    <option value="NFA Basics">NFA Basics</option>
                    <option value="States and Alphabets">States and Alphabets</option>
                    <option value="Transition Functions">Transition Functions</option>
                    <option value="Accepted Strings">Accepted Strings</option>
                    <option value="Rejected Strings">Rejected Strings</option>
                    <option value="State Tracing">State Tracing</option>
                    <option value="Transition Tables">Transition Tables</option>
                    <option value="NFA Construction">NFA Construction</option>
                    <option value="NFA to DFA Conversion">NFA to DFA Conversion</option>
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-dimmed)', fontWeight: 700 }}>Filter Difficulty</label>
                  <select 
                    value={qBankDifficulty} 
                    onChange={(e) => setQBankDifficulty(e.target.value)} 
                    style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px', fontSize: '13px' }}
                  >
                    <option value="All">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-dimmed)', fontWeight: 700 }}>Filter User Status</label>
                  <select 
                    value={qBankFilterStatus} 
                    onChange={(e) => setQBankFilterStatus(e.target.value as any)} 
                    style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px', fontSize: '13px' }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Bookmarked">Bookmarked Only</option>
                    <option value="Solved">Solved Successfully</option>
                    <option value="Unsolved">Unsolved</option>
                    <option value="Incorrect">Incorrect Previously</option>
                  </select>
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Found <strong>{filteredQuestions.length}</strong> questions matching constraints.
                </span>
                <Button variant="primary" size="sm" onClick={startCustomPractice} disabled={filteredQuestions.length === 0} glow>
                  ⚡ Start Quiz with Filtered Set ({filteredQuestions.length})
                </Button>
              </div>
            </Card>

            {/* Split Screen Layout */}
            <div style={{ display: 'flex', gap: '20px', minHeight: '450px' }}>
              
              {/* Left Panel: Questions List */}
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '550px', overflowY: 'auto', paddingRight: '4px' }}>
                {filteredQuestions.length === 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', border: '1.5px dashed var(--border-medium)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No matching questions in database repository.
                  </div>
                ) : (
                  filteredQuestions.map((q) => {
                    const isSelected = q.id === selectedQBankId;
                    const solved = (qBankCorrects[q.id] || 0) > 0;
                    const bookmarked = qBankBookmarks.includes(q.id);
                    const diffColor = q.difficulty === 'Easy' ? 'var(--accent-success)' : q.difficulty === 'Medium' ? 'var(--accent-warning)' : 'var(--accent-purple)';
                    
                    return (
                      <div 
                        key={q.id}
                        onClick={() => setSelectedQBankId(q.id)}
                        style={{
                          padding: '14px',
                          borderRadius: '6px',
                          background: isSelected ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)',
                          border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'transform 0.15s, border 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>#{q.id}</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: 600, color: isSelected ? 'var(--accent-cyan)' : '#fff' }}>{q.title}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-dimmed)' }}>{q.category} • {q.type}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {solved && <span style={{ color: 'var(--accent-success)', fontSize: '11px' }}>✓ Solved</span>}
                          {bookmarked && <span style={{ color: 'var(--accent-warning)', fontSize: '11px' }}>★</span>}
                          <span style={{ fontSize: '10px', fontWeight: 700, color: diffColor, textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)', padding: '2px 6px', borderRadius: '4px', border: `1px solid ${diffColor}` }}>
                            {q.difficulty}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Panel: Detailed Preview Panel */}
              <Card glass style={{ flex: '1.2', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', position: 'sticky', top: '10px', maxHeight: '550px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Question ID #{selectedQ.id}</span>
                    <h4 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>{selectedQ.title}</h4>
                  </div>
                  
                  {/* Bookmark Button */}
                  <Button 
                    variant={isSelectedBookmarked ? 'primary' : 'outline'} 
                    size="sm" 
                    onClick={() => toggleBookmark(selectedQ.id)}
                  >
                    {isSelectedBookmarked ? '★ Bookmarked' : '☆ Bookmark'}
                  </Button>
                </div>

                {/* Metadata Tags */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', background: 'rgba(61,235,255,0.05)', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    {selectedQ.category}
                  </span>
                  <span style={{ fontSize: '11px', color: '#ffc857', background: 'rgba(255,200,87,0.05)', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    💎 +{selectedQ.xpReward} XP
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-main)', background: 'rgba(255,255,255,0.03)', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    ⏱️ Est: {selectedQ.estTime}
                  </span>
                </div>

                {/* Question Statement */}
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5, background: 'var(--bg-hover)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <strong>Question Statement:</strong>
                  <p style={{ marginTop: '6px' }}>{selectedQ.question}</p>
                </div>

                {/* Diagram if applicable */}
                {selectedQ.hasDiagram && (
                  <div style={{ display: 'flex', justifyContent: 'center', background: 'var(--bg-panel)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <svg width="240" height="80" viewBox="0 0 280 90">
                      <defs>
                        <marker id="bank-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--graph-arrow)" />
                        </marker>
                      </defs>

                      {/* Start Arrow */}
                      <path d="M 15 45 L 40 45" stroke="var(--graph-start-arrow)" strokeWidth="1.5" fill="none" markerEnd="url(#bank-arrow)" />
                      <text x="25" y="38" fontSize="9" fontFamily="var(--font-mono)" fill="var(--text-muted)" fontWeight="bold" textAnchor="middle">Start</text>

                      {/* Transition Path */}
                      <path d="M 78 45 L 180 45" stroke="var(--graph-edge)" strokeWidth="1.5" fill="none" markerEnd="url(#bank-arrow)" />
                      <text x="130" y="34" fill="var(--accent-cyan)" fontSize="11" fontFamily="var(--font-mono)" fontWeight="bold" stroke="var(--graph-label-bg)" strokeWidth="3" paintOrder="stroke" textAnchor="middle">1</text>

                      {/* Node q0 */}
                      <circle cx="60" cy="45" r="18" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="1.5" />
                      <text x="60" y="49" textAnchor="middle" fill="var(--text-main)" fontSize="11" fontWeight="bold">q0</text>

                      {/* Node q1 */}
                      <circle cx="200" cy="45" r="18" fill="var(--bg-card)" stroke="var(--border-strong)" strokeWidth="1.5" />
                      <circle cx="200" cy="45" r="15" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" />
                      <text x="200" y="49" textAnchor="middle" fill="var(--text-main)" fontSize="11" fontWeight="bold">q1</text>
                    </svg>
                  </div>
                )}

                {/* Options List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>Options:</span>
                  {selectedQ.options.map((opt, oIdx) => (
                    <div 
                      key={oIdx}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '4px',
                        border: oIdx === selectedQ.correctIndex ? '1px solid var(--accent-success)' : '1px solid var(--border-subtle)',
                        background: oIdx === selectedQ.correctIndex ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.01)',
                        fontSize: '13px',
                        color: oIdx === selectedQ.correctIndex ? 'var(--accent-success)' : '#fff'
                      }}
                    >
                      {opt} {oIdx === selectedQ.correctIndex && '✓ (Correct Option)'}
                    </div>
                  ))}
                </div>

                {/* Pedagogical Explanation Review Mode */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '11.5px', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>💡 Review & Explanation</span>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{selectedQ.explanation}</p>
                </div>

                {/* Performance tagging values */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-dimmed)' }}>
                  <span>Attempted: <strong>{qBankAttempts[selectedQ.id] || 0} times</strong></span>
                  <span>Correct: <strong>{qBankCorrects[selectedQ.id] || 0} times</strong></span>
                  <span>Accuracy: <strong style={{ color: 'var(--accent-cyan)' }}>
                    {qBankAttempts[selectedQ.id] ? Math.round(((qBankCorrects[selectedQ.id] || 0) / qBankAttempts[selectedQ.id]) * 100) : 0}%
                  </strong></span>
                </div>

              </Card>

            </div>

          </div>
        );
      })()}

    </div>
  );
};

export default NfaAcademy;
