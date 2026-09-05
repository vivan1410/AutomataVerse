import React, { useState, useEffect } from 'react';
import './MiniGamesHub.css';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';

interface MiniGamesHubProps {
  awardRewards?: (type: 'lesson' | 'quiz' | 'challenge' | 'achievement', id: string, extra?: any) => void;
  showToast?: (message: string) => void;
  profile?: any;
}

export const MiniGamesHub: React.FC<MiniGamesHubProps> = ({ awardRewards, showToast }) => {
  const [activeGame, setActiveGame] = useState<'HUB' | 'DRAG_LABEL' | 'MISSING_LINK' | 'STATE_PUZZLE' | 'PREDICT'>('HUB');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Advanced'>('Beginner');
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);

  // Trigger rewards when game completes
  useEffect(() => {
    if (isGameOver && activeGame !== 'HUB') {
      awardRewards?.('challenge', `minigame_${activeGame}_${Date.now()}`, 'Easy');
      showToast?.(`Mini-Game Completed! Check profile for updated scores.`);
    }
  }, [isGameOver, activeGame]);

  // Sub-game 1: Drag the Transition labels
  const [t1Label, setT1Label] = useState<string | null>(null);
  const [t2Label, setT2Label] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<'t1' | 't2' | null>(null);

  // Sub-game 2: Missing Transition choice
  const [missingSolved, setMissingSolved] = useState<boolean | null>(null);

  // Sub-game 3: DFA Puzzle state placements
  const [slot1Node, setSlot1Node] = useState<string | null>(null);
  const [slot2Node, setSlot2Node] = useState<string | null>(null);
  const [slot3Node, setSlot3Node] = useState<string | null>(null);
  const [selectedPuzzleNode, setSelectedPuzzleNode] = useState<string | null>(null);
  const [puzzleDragOverSlot, setPuzzleDragOverSlot] = useState<'s1' | 's2' | 's3' | null>(null);

  // Sub-game 4: String Prediction consecutive trace rounds
  const [predictRound, setPredictRound] = useState(1);
  const [predictScore, setPredictScore] = useState(0);
  const [currentPredictString, setCurrentPredictString] = useState('aba');
  const [predictAnswer, setPredictAnswer] = useState<'accept' | 'reject'>('accept'); // Rule: contains 'ab'
  const [predictFeedback, setPredictFeedback] = useState<'correct' | 'incorrect' | null>(null);

  // Global game timer ticker loop
  useEffect(() => {
    if (activeGame === 'HUB' || isGameOver) return;
    

    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsGameOver(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [activeGame, isGameOver, difficulty]);

  // Handle game launches
  const launchGame = (game: typeof activeGame) => {
    setActiveGame(game);
    setTimeLeft(difficulty === 'Beginner' ? 60 : 30);
    setScore(0);
    setXpEarned(0);
    setCoinsEarned(0);
    setIsGameOver(false);

    // Reset sub-game states
    setT1Label(null);
    setT2Label(null);
    setMissingSolved(null);
    setSlot1Node(null);
    setSlot2Node(null);
    setSlot3Node(null);
    setPredictRound(1);
    setPredictScore(0);
    generatePredictRound();
  };

  // -------------------------------------------------------------
  // GAME 1: DRAG THE TRANSITION
  // -------------------------------------------------------------
  const handleDragLabelStart = (e: React.DragEvent, symbol: string) => {
    e.dataTransfer.setData('text/plain', symbol);
  };

  const handleDropLabel = (e: React.DragEvent, target: 't1' | 't2') => {
    e.preventDefault();
    setDragOverTarget(null);
    const symbol = e.dataTransfer.getData('text/plain');
    evaluateDropLabel(symbol, target);
  };

  const evaluateDropLabel = (symbol: string, target: 't1' | 't2') => {
    // Target DFA accepts strings with an odd number of 'a's. Transition slots:
    // Slot 1 (q0 -> q1 on 'a'): Correct symbol is 'a'
    // Slot 2 (q1 -> q0 on 'a'): Correct symbol is 'a'
    if (target === 't1' && symbol === 'a') {
      setT1Label('a');
    } else if (target === 't2' && symbol === 'a') {
      setT2Label('a');
    } else {
      // time penalty for wrong drop
      setTimeLeft((prev) => Math.max(0, prev - 5));
    }
  };

  // Mobile click fallback
  const handleSlotClick = (target: 't1' | 't2') => {
    if (selectedSymbol) {
      evaluateDropLabel(selectedSymbol, target);
      setSelectedSymbol(null);
    }
  };

  useEffect(() => {
    if (activeGame === 'DRAG_LABEL' && t1Label && t2Label) {
      setScore(100);
      setXpEarned(50);
      setCoinsEarned(5);
      setIsGameOver(true);
    }
  }, [t1Label, t2Label, activeGame]);

  // -------------------------------------------------------------
  // GAME 2: MISSING TRANSITION
  // -------------------------------------------------------------
  const handleMissingSubmit = (choice: 'q0' | 'q1') => {
    // Rule: Accepts binary strings that do not end in the substring '11'.
    // States: q0 (no trailing 1 / start / accept), q1 (trailing 1 / accept).
    // Missing transition is: transition from q1 on input '0'.
    // Correct answer: transitions back to q0. So choice is q0!
    if (choice === 'q0') {
      setMissingSolved(true);
      setScore(100);
      setXpEarned(50);
      setCoinsEarned(5);
    } else {
      setMissingSolved(false);
      setTimeLeft((prev) => Math.max(0, prev - 8));
    }
    setTimeout(() => {
      setIsGameOver(true);
    }, 1200);
  };

  // -------------------------------------------------------------
  // GAME 3: DFA PUZZLE STATE PLACEMENTS
  // -------------------------------------------------------------
  const handlePuzzleDragStart = (e: React.DragEvent, node: string) => {
    e.dataTransfer.setData('text/plain', node);
  };

  const handlePuzzleDrop = (e: React.DragEvent, slot: 's1' | 's2' | 's3') => {
    e.preventDefault();
    setPuzzleDragOverSlot(null);
    const node = e.dataTransfer.getData('text/plain');
    evaluatePuzzleDrop(node, slot);
  };

  const evaluatePuzzleDrop = (node: string, slot: 's1' | 's2' | 's3') => {
    // Slot 1 (Start state slot): Correct node is 'q0'
    // Slot 2 (Intermediate state slot): Correct node is 'q1'
    // Slot 3 (Accept state slot): Correct node is 'q2'
    if (slot === 's1' && node === 'q0') {
      setSlot1Node('q0');
    } else if (slot === 's2' && node === 'q1') {
      setSlot2Node('q1');
    } else if (slot === 's3' && node === 'q2') {
      setSlot3Node('q2');
    } else {
      setTimeLeft((prev) => Math.max(0, prev - 6));
    }
  };

  const handlePuzzleSlotClick = (slot: 's1' | 's2' | 's3') => {
    if (selectedPuzzleNode) {
      evaluatePuzzleDrop(selectedPuzzleNode, slot);
      setSelectedPuzzleNode(null);
    }
  };

  useEffect(() => {
    if (activeGame === 'STATE_PUZZLE' && slot1Node && slot2Node && slot3Node) {
      setScore(100);
      setXpEarned(60);
      setCoinsEarned(6);
      setIsGameOver(true);
    }
  }, [slot1Node, slot2Node, slot3Node, activeGame]);

  // -------------------------------------------------------------
  // GAME 4: STRING PREDICTION
  // -------------------------------------------------------------
  const generatePredictRound = () => {
    const strings = ['aba', 'bab', 'bba', 'baab', 'babab', 'bbbb', 'baaa'];
    const index = Math.floor(Math.random() * strings.length);
    const randomStr = strings[index];
    
    // Treat 'a' as 0 and 'b' as 1. Divisible by 3 check:
    let num = 0;
    for (let i = 0; i < randomStr.length; i++) {
      num = num * 2 + (randomStr[i] === 'b' ? 1 : 0);
    }
    const accepts = num % 3 === 0;
    
    setCurrentPredictString(randomStr);
    setPredictAnswer(accepts ? 'accept' : 'reject');
    setPredictFeedback(null);
  };

  const handlePredictSubmit = (prediction: 'accept' | 'reject') => {
    const isCorrect = prediction === predictAnswer;
    
    if (isCorrect) {
      setPredictScore((prev) => prev + 1);
      setPredictFeedback('correct');
    } else {
      setPredictFeedback('incorrect');
      setTimeLeft((prev) => Math.max(0, prev - 4));
    }

    setTimeout(() => {
      if (predictRound < 5) {
        setPredictRound((prev) => prev + 1);
        generatePredictRound();
      } else {
        // Evaluate overall prediction score
        setScore(predictScore * 20);
        setXpEarned(predictScore * 15);
        setCoinsEarned(predictScore * 2);
        setIsGameOver(true);
      }
    }, 1000);
  };

  return (
    <div className="games-hub-container">
      
      {/* ---------------- 1. GAMES HUB OVERVIEW GRID ---------------- */}
      {activeGame === 'HUB' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Hub Header Card */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px 24px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Automata Academy</span>
              <h2 className="view-title" style={{ marginTop: '2px', fontSize: '20px' }}>Mini Games Hub</h2>
            </div>

            {/* Difficulty select toggle */}
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-subtle)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
              <Button variant="ghost" size="sm" active={difficulty === 'Beginner'} onClick={() => setDifficulty('Beginner')} style={{ height: '24px', fontSize: '11px', padding: '0 8px' }}>
                Beginner (60s)
              </Button>
              <Button variant="ghost" size="sm" active={difficulty === 'Advanced'} onClick={() => setDifficulty('Advanced')} style={{ height: '24px', fontSize: '11px', padding: '0 8px' }}>
                Advanced (30s)
              </Button>
            </div>
          </div>

          <div className="games-grid">
            
            {/* Hub Game Card 1 */}
            <Card glass className="game-preview-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <CardHeader style={{ padding: 0 }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--accent-cyan)' }}>Visual puzzle</span>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>Drag the Transition</h3>
              </CardHeader>
              <CardBody style={{ padding: 0 }}>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  Drag transition labels (0, 1) and drop them onto the correct state map arrows.
                </p>
              </CardBody>
              <Button variant="primary" size="sm" onClick={() => launchGame('DRAG_LABEL')} style={{ marginTop: 'auto' }}>
                Play Game
              </Button>
            </Card>

            {/* Hub Game Card 2 */}
            <Card glass className="game-preview-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <CardHeader style={{ padding: 0 }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--accent-purple)' }}>Deduction Game</span>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>Missing Transition</h3>
              </CardHeader>
              <CardBody style={{ padding: 0 }}>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  Find the single missing link state required to satisfy the language rules.
                </p>
              </CardBody>
              <Button variant="primary" size="sm" onClick={() => launchGame('MISSING_LINK')} style={{ marginTop: 'auto' }}>
                Play Game
              </Button>
            </Card>

            {/* Hub Game Card 3 */}
            <Card glass className="game-preview-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <CardHeader style={{ padding: 0 }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--accent-warning)' }}>Logical Puzzle</span>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>DFA Puzzle</h3>
              </CardHeader>
              <CardBody style={{ padding: 0 }}>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  Drag and sort shuffled states into start, intermediate, or accept diagram slots.
                </p>
              </CardBody>
              <Button variant="primary" size="sm" onClick={() => launchGame('STATE_PUZZLE')} style={{ marginTop: 'auto' }}>
                Play Game
              </Button>
            </Card>

            {/* Hub Game Card 4 */}
            <Card glass className="game-preview-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <CardHeader style={{ padding: 0 }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-main)' }}>Trace Speed test</span>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>String Prediction</h3>
              </CardHeader>
              <CardBody style={{ padding: 0 }}>
                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  Evaluate string input sequences in 5 rounds of high-speed prediction traces.
                </p>
              </CardBody>
              <Button variant="primary" size="sm" onClick={() => launchGame('PREDICT')} style={{ marginTop: 'auto' }}>
                Play Game
              </Button>
            </Card>

          </div>
        </div>
      )}

      {/* ---------------- 2. ACTIVE MINI GAMES SCREEN ---------------- */}
      {activeGame !== 'HUB' && !isGameOver && (
        <div className="game-active-container animate-scale-in">
          
          {/* Header dashboard stats */}
          <div className="game-timer-row">
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>Active Mini Game</span>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                {activeGame === 'DRAG_LABEL' && 'Drag the Transition'}
                {activeGame === 'MISSING_LINK' && 'Missing Transition'}
                {activeGame === 'STATE_PUZZLE' && 'DFA Puzzle'}
                {activeGame === 'PREDICT' && `String Prediction (Round ${predictRound}/5)`}
              </h3>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dimmed)', marginRight: '8px' }}>Timer:</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: timeLeft <= 10 ? 'var(--accent-error)' : 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* GAME 1 IMPLEMENTATION VIEWPORT */}
          {activeGame === 'DRAG_LABEL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
              
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>Target Rule</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                  DFA over Σ = {"{a, b}"} accepts strings with an odd number of "a"s
                </div>
              </div>

              {/* 2-State SVG transition slots map */}
              <svg viewBox="0 0 400 120" width="100%" height="110" style={{ overflow: 'visible' }}>
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.2)" />
                  </marker>
                </defs>

                {/* Transition line 1: q0 -> q1 */}
                <path d="M 80 60 L 320 60" stroke={t1Label ? 'var(--accent-cyan)' : 'var(--border-medium)'} strokeWidth="2" markerEnd="url(#arrow)" />

                {/* Transition line 2: q1 -> q0 (lower curved loop) */}
                <path d="M 320 72 Q 200 120 80 72" stroke={t2Label ? 'var(--accent-purple)' : 'var(--border-medium)'} strokeWidth="2" markerEnd="url(#arrow)" />

                {/* State q0 */}
                <g transform="translate(60, 60)">
                  <circle cx="0" cy="0" r="20" className="dfa-node-circle active" fill="var(--bg-card)" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                  <text x="0" y="4" textAnchor="middle" fill="var(--text-main)" fontSize="11">q0</text>
                </g>

                {/* State q1 */}
                <g transform="translate(340, 60)">
                  <circle cx="0" cy="0" r="20" className="dfa-node-circle active-purple" fill="var(--bg-card)" stroke="var(--accent-purple)" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="16" fill="none" stroke="var(--border-medium)" strokeWidth="1" />
                  <text x="0" y="4" textAnchor="middle" fill="var(--text-main)" fontSize="11">q1</text>
                </g>

                {/* Dropzone 1 (on path q0 -> q1, needs 'a') */}
                <foreignObject x="188" y="48" width="24" height="24">
                  <div 
                    className={`dropzone-circle ${dragOverTarget === 't1' ? 'drag-over' : ''} ${t1Label ? 'filled-cyan' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOverTarget('t1'); }}
                    onDragLeave={() => setDragOverTarget(null)}
                    onDrop={(e) => handleDropLabel(e, 't1')}
                    onClick={() => handleSlotClick('t1')}
                  >
                    {t1Label ? t1Label : '?'}
                  </div>
                </foreignObject>

                {/* Dropzone 2 (on path q1 -> q0, needs 'a') */}
                <foreignObject x="188" y="80" width="24" height="24">
                  <div 
                    className={`dropzone-circle ${dragOverTarget === 't2' ? 'drag-over' : ''} ${t2Label ? 'filled-purple' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOverTarget('t2'); }}
                    onDragLeave={() => setDragOverTarget(null)}
                    onDrop={(e) => handleDropLabel(e, 't2')}
                    onClick={() => handleSlotClick('t2')}
                  >
                    {t2Label ? t2Label : '?'}
                  </div>
                </foreignObject>
              </svg>

              {/* Draggable items row / Click toggles */}
              <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', width: '100%', justifyContent: 'center' }}>
                <div 
                  className="alphabet-token" 
                  draggable={!(t1Label && t2Label)} 
                  onDragStart={(e) => handleDragLabelStart(e, 'a')}
                  onClick={() => setSelectedSymbol('a')}
                  style={{
                    opacity: (t1Label && t2Label) ? 0.35 : 1,
                    pointerEvents: (t1Label && t2Label) ? 'none' : 'auto',
                    borderWidth: selectedSymbol === 'a' ? '2.5px' : '1.5px',
                    borderColor: selectedSymbol === 'a' ? 'var(--accent-cyan)' : 'var(--border-medium)',
                    boxShadow: selectedSymbol === 'a' ? '0 0 12px var(--accent-cyan-glow)' : 'none'
                  }}
                >
                  a
                </div>
                <div 
                  className="alphabet-token" 
                  draggable={true} 
                  onDragStart={(e) => handleDragLabelStart(e, 'b')}
                  onClick={() => setSelectedSymbol('b')}
                  style={{
                    color: 'var(--accent-purple)',
                    borderWidth: selectedSymbol === 'b' ? '2.5px' : '1.5px',
                    borderColor: selectedSymbol === 'b' ? 'var(--accent-purple)' : 'var(--border-medium)',
                    boxShadow: selectedSymbol === 'b' ? '0 0 12px var(--accent-purple-glow)' : 'none'
                  }}
                >
                  b
                </div>
              </div>
            </div>
          )}

          {/* GAME 2: MISSING TRANSITION VIEWPORT */}
          {activeGame === 'MISSING_LINK' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>DFA Language Goal</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                  DFA accepts binary strings that do not end in the substring '11'
                </div>
              </div>

              {/* 2-State SVG indicating missing arrow link */}
              <svg viewBox="0 0 400 120" width="100%" height="110" style={{ overflow: 'visible' }}>
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.2)" />
                  </marker>
                </defs>

                {/* State q0 (Accept state) */}
                <g transform="translate(100, 60)">
                  <circle cx="0" cy="0" r="20" className="dfa-node-circle active" fill="var(--bg-card)" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="16" fill="none" stroke="var(--border-medium)" strokeWidth="1" />
                  <text x="0" y="4" textAnchor="middle" fill="var(--text-main)" fontSize="11">q0</text>
                </g>

                {/* State q1 (Accept state too) */}
                <g transform="translate(300, 60)">
                  <circle cx="0" cy="0" r="20" className="dfa-node-circle active-purple" fill="var(--bg-card)" stroke="var(--accent-purple)" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="16" fill="none" stroke="var(--border-medium)" strokeWidth="1" />
                  <text x="0" y="4" textAnchor="middle" fill="var(--text-main)" fontSize="11">q1</text>
                </g>

                {/* Existing Transitions */}
                <path d="M 100 40 Q 200 15 300 40" stroke="var(--border-medium)" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x="200" y="24" fontSize="10" fontFamily="var(--font-mono)" fill="var(--text-dimmed)" textAnchor="middle">1</text>

                {/* Missing Transition arrow indicator */}
                <path d="M 300 80 Q 200 105 100 80" stroke="var(--accent-error)" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
                <text x="200" y="102" fontSize="11" fontFamily="var(--font-mono)" fill="var(--accent-error)" fontWeight="700" textAnchor="middle">0 (Missing?)</text>

                {/* Self loop q0 */}
                <path d="M 80 48 C 55 15, 55 105, 80 72" fill="none" stroke="var(--border-medium)" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x="45" y="60" fontSize="10" fontFamily="var(--font-mono)" fill="var(--text-dimmed)" textAnchor="middle">0</text>

                {/* Self loop q1 */}
                <path d="M 320 48 C 345 15, 345 105, 320 72" fill="none" stroke="var(--border-medium)" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x="355" y="60" fontSize="10" fontFamily="var(--font-mono)" fill="var(--text-dimmed)" textAnchor="middle">1</text>
              </svg>

              {/* Multiple Choice Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '320px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dimmed)', textTransform: 'uppercase', textAlign: 'center', marginBottom: '4px' }}>
                  Choose Correct target state for transition δ(q1, 0)
                </div>
                <div className="interactive-option-card" onClick={() => handleMissingSubmit('q1')}>
                  Loop to self on state q1
                </div>
                <div className="interactive-option-card" onClick={() => handleMissingSubmit('q0')}>
                  Point to accept state q0
                </div>
              </div>

              {missingSolved !== null && (
                <div style={{ color: missingSolved ? 'var(--accent-success)' : 'var(--accent-error)', fontSize: '14px', fontWeight: 600 }}>
                  {missingSolved ? '✓ Correct! δ(q1, 0) = q0.' : '✗ Incorrect! Try again.'}
                </div>
              )}
            </div>
          )}

          {/* GAME 3: DFA PUZZLE SHUFFLED STATES VIEWPORT */}
          {activeGame === 'STATE_PUZZLE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>Target Rule</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                  DFA over Σ = {"{a, b}"} accepts strings ending in 'ab'. Sort States: q0 is Start, q1 is Intermediate, q2 is Accept (double border).
                </div>
              </div>

              {/* Shuffled Placements targets slots */}
              <div className="puzzle-slots-container" style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '420px', justifyContent: 'center' }}>
                
                {/* Slot 1: Start state target */}
                <div 
                  className={`puzzle-slot ${puzzleDragOverSlot === 's1' ? 'drag-over' : ''} ${slot1Node ? 'filled' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setPuzzleDragOverSlot('s1'); }}
                  onDragLeave={() => setPuzzleDragOverSlot(null)}
                  onDrop={(e) => handlePuzzleDrop(e, 's1')}
                  onClick={() => handlePuzzleSlotClick('s1')}
                  style={{ position: 'relative', flex: 1 }}
                >
                  <span style={{ position: 'absolute', top: '8px', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>Start Slot</span>
                  {/* Incoming Start Arrow indicator */}
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-cyan)', marginBottom: '8px', marginTop: '12px' }}>
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                  {slot1Node ? <div className="shuffled-node-token">{slot1Node}</div> : 'Drop Start here'}
                </div>

                {/* Slot 2: Intermediate state target */}
                <div 
                  className={`puzzle-slot ${puzzleDragOverSlot === 's2' ? 'drag-over' : ''} ${slot2Node ? 'filled' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setPuzzleDragOverSlot('s2'); }}
                  onDragLeave={() => setPuzzleDragOverSlot(null)}
                  onDrop={(e) => handlePuzzleDrop(e, 's2')}
                  onClick={() => handlePuzzleSlotClick('s2')}
                  style={{ position: 'relative', flex: 1 }}
                >
                  <span style={{ position: 'absolute', top: '8px', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>Middle Slot</span>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid var(--accent-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', marginTop: '12px' }} />
                  {slot2Node ? <div className="shuffled-node-token" style={{ borderColor: 'var(--accent-warning)' }}>{slot2Node}</div> : 'Drop Middle here'}
                </div>

                {/* Slot 3: Accept state target */}
                <div 
                  className={`puzzle-slot ${puzzleDragOverSlot === 's3' ? 'drag-over' : ''} ${slot3Node ? 'filled' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setPuzzleDragOverSlot('s3'); }}
                  onDragLeave={() => setPuzzleDragOverSlot(null)}
                  onDrop={(e) => handlePuzzleDrop(e, 's3')}
                  onClick={() => handlePuzzleSlotClick('s3')}
                  style={{ position: 'relative', flex: 1 }}
                >
                  <span style={{ position: 'absolute', top: '8px', fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>Accept Slot</span>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', marginTop: '12px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1px solid var(--accent-purple)' }} />
                  </div>
                  {slot3Node ? <div className="shuffled-node-token" style={{ borderColor: 'var(--accent-purple)' }}>{slot3Node}</div> : 'Drop Accept here'}
                </div>

              </div>

              {/* Shuffled source nodes */}
              <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', width: '100%', justifyContent: 'center' }}>
                <div 
                  className="shuffled-node-token"
                  draggable={!slot1Node}
                  onDragStart={(e) => handlePuzzleDragStart(e, 'q0')}
                  onClick={() => setSelectedPuzzleNode('q0')}
                  style={{
                    opacity: slot1Node ? 0.3 : 1,
                    pointerEvents: slot1Node ? 'none' : 'auto',
                    borderWidth: selectedPuzzleNode === 'q0' ? '2.5px' : '1.5px',
                    borderColor: selectedPuzzleNode === 'q0' ? 'var(--accent-cyan)' : 'var(--border-strong)',
                  }}
                >
                  q0
                </div>

                <div 
                  className="shuffled-node-token"
                  draggable={!slot2Node}
                  onDragStart={(e) => handlePuzzleDragStart(e, 'q1')}
                  onClick={() => setSelectedPuzzleNode('q1')}
                  style={{
                    opacity: slot2Node ? 0.3 : 1,
                    pointerEvents: slot2Node ? 'none' : 'auto',
                    borderWidth: selectedPuzzleNode === 'q1' ? '2.5px' : '1.5px',
                    borderColor: selectedPuzzleNode === 'q1' ? 'var(--accent-warning)' : 'var(--border-strong)',
                  }}
                >
                  q1
                </div>

                <div 
                  className="shuffled-node-token"
                  draggable={!slot3Node}
                  onDragStart={(e) => handlePuzzleDragStart(e, 'q2')}
                  onClick={() => setSelectedPuzzleNode('q2')}
                  style={{
                    opacity: slot3Node ? 0.3 : 1,
                    pointerEvents: slot3Node ? 'none' : 'auto',
                    borderWidth: selectedPuzzleNode === 'q2' ? '2.5px' : '1.5px',
                    borderColor: selectedPuzzleNode === 'q2' ? 'var(--accent-purple)' : 'var(--border-strong)',
                  }}
                >
                  q2
                </div>
              </div>

            </div>
          )}

          {/* GAME 4: STRING PREDICTION VIEWPORT */}
          {activeGame === 'PREDICT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>DFA Recognition Rule</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                  DFA accepts strings where (treating a=0, b=1) the binary number N ≡ 0 (mod 3)
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '24px 64px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dimmed)', display: 'block', marginBottom: '8px' }}>Trace string sequence</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '32px', fontWeight: 800, color: 'var(--accent-warning)', letterSpacing: '0.06em' }}>
                  "{currentPredictString}"
                </span>
              </div>

              <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '320px' }}>
                <Button 
                  variant="primary" 
                  style={{ flex: 1, background: 'rgba(64, 232, 122, 0.08)', borderColor: 'var(--accent-success)', color: 'var(--accent-success)', height: '44px' }}
                  onClick={() => handlePredictSubmit('accept')}
                >
                  Accept
                </Button>
                <Button 
                  variant="outline" 
                  style={{ flex: 1, background: 'rgba(255, 93, 115, 0.08)', borderColor: 'var(--accent-error)', color: 'var(--accent-error)', height: '44px' }}
                  onClick={() => handlePredictSubmit('reject')}
                >
                  Reject
                </Button>
              </div>

              {predictFeedback !== null && (
                <div style={{ fontSize: '14px', fontWeight: 600, color: predictFeedback === 'correct' ? 'var(--accent-success)' : 'var(--accent-error)' }}>
                  {predictFeedback === 'correct' ? '✓ Correct prediction!' : '✗ Wrong prediction! -4s timer penalty.'}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ---------------- 3. END GAME STATUS REPORT ---------------- */}
      {activeGame !== 'HUB' && isGameOver && (
        <Card glass style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }} className="animate-scale-in">
          <div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-success)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Game Over</span>
            <h1 className="view-title" style={{ fontSize: '32px', marginTop: '8px' }}>Challenge Results</h1>
            <p className="view-desc">Mini game results verified. Check your reward scores below.</p>
          </div>

          <div className="game-over-grid" style={{ maxWidth: '380px' }}>
            <div className="game-over-stat">
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>Final Score</span>
              <div className="game-over-value" style={{ color: 'var(--accent-cyan)' }}>{score}</div>
            </div>
            <div className="game-over-stat">
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>XP REWARDS</span>
              <div className="game-over-value" style={{ color: 'var(--accent-success)' }}>+{xpEarned}</div>
            </div>
            <div className="game-over-stat">
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dimmed)' }}>COINS EARNED</span>
              <div className="game-over-value">🪙 {coinsEarned}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="primary" onClick={() => launchGame(activeGame)} glow>
              Play Again
            </Button>
            <Button variant="secondary" onClick={() => setActiveGame('HUB')}>
              Games Hub
            </Button>
          </div>
        </Card>
      )}

    </div>
  );
};

export default MiniGamesHub;
