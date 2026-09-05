import React, { useState, useEffect } from 'react';
import './ChallengesSpeedRound.css';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import MiniGamesHub from './MiniGamesHub';

export interface Question {
  id: number;
  alphabet: string;
  rule: string;
  inputString?: string;
  correctAnswer?: 'accept' | 'reject';
  options?: string[];
  correctIndex?: number;
  explanation?: string;
  hint?: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
}

const QUESTION_POOL: Question[] = [
  {
    id: 1,
    alphabet: 'Σ = {0, 1}',
    rule: 'NFA to DFA Transition: Given NFA transitions δ(q0,0)={q0,q1} and δ(q1,1)={q2}. In subset construction, what is δ_D({q0,q1}, 1)?',
    options: ['{q0, q2}', '{q0, q1}', '{q2}', 'Ø'],
    correctIndex: 0,
    explanation: 'δ(q0,1) U δ(q1,1) = {q0} U {q2} = {q0, q2}.',
    difficulty: 'Easy'
  },
  {
    id: 2,
    alphabet: 'Σ = {0, 1}',
    rule: 'Epsilon Closure: An ε-NFA has transitions δ(q0,ε)={q1,q2} and δ(q1,ε)={q3}. What is ε-closure({q0})?',
    options: ['{q0, q1, q2, q3}', '{q0, q1, q2}', '{q0, q3}', '{q1, q2, q3}'],
    correctIndex: 0,
    explanation: 'Recursively follow ε jumps from q0: q0 -> q1, q2; q1 -> q3. Union = {q0, q1, q2, q3}.',
    difficulty: 'Easy'
  },
  {
    id: 3,
    alphabet: 'Σ = {0, 1}',
    rule: 'DFA State Tracing: DFA transitions δ(q0,1)=q1, δ(q1,0)=q2, δ(q2,1)=q3. What sequence of states is visited starting from q0 on input "101"?',
    options: ['q0 → q1 → q2 → q3', 'q0 → q0 → q1 → q2', 'q0 → q2 → q1 → q3', 'q0 → q1 → q3 → q2'],
    correctIndex: 0,
    explanation: 'Start q0 --1--> q1 --0--> q2 --1--> q3.',
    difficulty: 'Easy'
  },
  {
    id: 4,
    alphabet: 'Σ = {a, b}',
    rule: 'DFA Minimization: In a DFA, non-final states B and C both move to B on "a" and to accept state D on "b". How are B and C processed during minimization?',
    options: ['B and C are equivalent and merge into {B, C}', 'B and C must remain separate', 'B and C are deleted', 'B becomes the start state'],
    correctIndex: 0,
    explanation: 'Because B and C have identical transitions to equivalent states for all input symbols, they are indistinguishable.',
    difficulty: 'Easy'
  },
  {
    id: 5,
    alphabet: 'Σ = {0, 1}',
    rule: 'State Bounds: What is the minimum number of states in a DFA for binary strings whose 3rd symbol from the right is 1?',
    options: ['8 states', '4 states', '6 states', '16 states'],
    correctIndex: 0,
    explanation: 'By Myhill-Nerode, tracking the last 3 bits requires 2^3 = 8 pairwise distinguishable states.',
    difficulty: 'Moderate'
  },
  {
    id: 6,
    alphabet: 'Σ = {0, 1}',
    rule: 'NFA Path Verification: NFA has δ(q0,0)={q0,q1}, δ(q0,1)={q0}, δ(q1,1)={q2(accept)}. Which string is accepted?',
    options: ['001', '000', '111', '100'],
    correctIndex: 0,
    explanation: 'q0 --0--> q0 --0--> q1 --1--> q2 (accept).',
    difficulty: 'Moderate'
  },
  {
    id: 7,
    alphabet: 'Σ = {0, 1}',
    rule: 'Language Identification: A DFA over {0,1} has start q0, accept q2, and non-dead transitions δ(q0,0)=q1, δ(q1,1)=q2. All other inputs lead to trap state q_dead. What language is recognized?',
    options: ['Strings starting with "01"', 'Strings ending with "01"', 'Strings containing "01"', 'Strings with an even number of 0s'],
    correctIndex: 0,
    explanation: 'Only strings beginning with prefix "01" reach accepting state q2 without hitting q_dead.',
    difficulty: 'Moderate'
  },
  {
    id: 8,
    alphabet: 'Σ = {0, 1}',
    rule: 'Subset Construction Empty Set: In NFA → DFA subset construction, what role does the subset state Ø play?',
    options: ['The dead / trap state', 'The start state', 'The final state', 'An unreachable state'],
    correctIndex: 0,
    explanation: 'The empty set Ø represents the trap state where no active NFA threads remain.',
    difficulty: 'Moderate'
  },
  {
    id: 9,
    alphabet: 'Σ = {0, 1}',
    rule: 'Automaton to Regular Expression: Which regular expression represents binary strings containing an even number of 0s?',
    options: ['(1 | 0 1* 0)*', '(01)*', '1* 0 1*', '(00)*'],
    correctIndex: 0,
    explanation: 'Self-loops on 1s and pairs of 0s separated by arbitrary 1s maintain even 0 parity: (1 | 0 1* 0)*.',
    difficulty: 'Hard'
  },
  {
    id: 10,
    alphabet: 'Σ = {0, 1}',
    rule: 'DFA Minimization Partitioning: Given partition P0 = {{q0, q1}, {q2, q3}} with {q2, q3} accepting. What is the first refinement check?',
    options: ['Check if q0 and q1 transition to the same partition block for all input symbols', 'Merge all states into one block', 'Delete state q0', 'Swap the start state'],
    correctIndex: 0,
    explanation: 'Partition refinement tests if states within a block transition to identical target blocks.',
    difficulty: 'Hard'
  },
  {
    id: 11,
    alphabet: 'Σ = {a, b}',
    rule: 'Epsilon Closure Computation: An NFA has δ(q0, a)={q1} and δ(q0, ε)={q2}. What is ε-closure(q0)?',
    options: ['{q0, q2}', '{q0, q1}', '{q1, q2}', '{q0}'],
    correctIndex: 0,
    explanation: 'ε-closure(q0) includes q0 itself and all states reachable using exclusively ε edges ({q2}). Result: {q0, q2}.',
    difficulty: 'Hard'
  },
  {
    id: 12,
    alphabet: 'Σ = {0, 1}',
    rule: 'Arden\'s Lemma Requirement: According to Arden\'s Lemma, R = Q + RP has the unique solution R = QP* if and only if:',
    options: ['ε does not belong to P', 'P is the empty set', 'Q is finite', 'R is non-deterministic'],
    correctIndex: 0,
    explanation: 'Arden\'s Lemma requires that the regular expression P does not contain the empty string ε.',
    difficulty: 'Hard'
  },
  {
    id: 13,
    alphabet: 'Σ = {0, 1}',
    rule: 'Product Automaton Upper Bound: If DFA M1 has 3 states and DFA M2 has 4 states, what is the maximum number of states in product DFA M1 x M2?',
    options: ['12 states', '7 states', '64 states', '16 states'],
    correctIndex: 0,
    explanation: 'The state space Q = Q1 x Q2 contains 3 * 4 = 12 state pairs.',
    difficulty: 'Hard'
  },
  {
    id: 14,
    alphabet: 'Σ = {a, b}',
    rule: 'Myhill-Nerode Equivalence Index: For language L = { a^n b^n | n >= 0 }, how many equivalence classes are formed by Myhill-Nerode relation ≡L?',
    options: ['Infinitely many equivalence classes', 'Finite index of 2', 'Finite index of 4', 'Zero equivalence classes'],
    correctIndex: 0,
    explanation: 'Prefixes a^n for distinct n require distinct numbers of b\'s to be accepted, generating infinitely many equivalence classes.',
    difficulty: 'Hard'
  },
  {
    id: 15,
    alphabet: 'Σ = {0, 1}',
    rule: 'Transition Table Multi-Step Trace: Given DFA transitions δ(q0,0)=q1 and δ(q1,0)=q2. Which state is reached from q0 on input "00"?',
    options: ['q2', 'q1', 'q0', 'q_dead'],
    correctIndex: 0,
    explanation: 'q0 --0--> q1 --0--> q2.',
    difficulty: 'Hard'
  }
];

interface ChallengesSpeedRoundProps {
  awardRewards?: (type: 'lesson' | 'quiz' | 'challenge' | 'achievement', id: string, extra?: any) => void;
  showToast?: (message: string) => void;
  profile?: any;
}

export const ChallengesSpeedRound: React.FC<ChallengesSpeedRoundProps> = ({
  awardRewards,
  showToast,
  profile,
}) => {
  const [challengeMode, setChallengeMode] = useState<'SPEED_ROUND' | 'GAMES'>(() => {
    return (sessionStorage.getItem('av_challenges_mode') as any) || 'SPEED_ROUND';
  });

  const [gameType, setGameType] = useState<'SPEED_CHALLENGE' | 'PRACTICE_ARENA'>(() => {
    return (sessionStorage.getItem('av_game_type') as any) || 'SPEED_CHALLENGE';
  });

  useEffect(() => {
    const scrollTarget = sessionStorage.getItem('av_nav_scroll_target');
    if (scrollTarget === 'challenges') {
      sessionStorage.removeItem('av_nav_scroll_target');
      setChallengeMode('SPEED_ROUND');
    }
  }, []);

  useEffect(() => {
    const storedType = sessionStorage.getItem('av_game_type');
    if (storedType) {
      setGameType(storedType as any);
    }
  }, [challengeMode]);

  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [currentPoolIndex, setCurrentPoolIndex] = useState(0);
  const [flashState, setFlashState] = useState<'correct' | 'incorrect' | null>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'OVER'>('START');
  const [lives, setLives] = useState(3);
  const [gameStartTime, setGameStartTime] = useState(0);
  const [gameElapsedTime, setGameElapsedTime] = useState(0);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    if (gameType === 'PRACTICE_ARENA') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameElapsedTime(Math.round((Date.now() - gameStartTime) / 1000));
          setGameState('OVER');
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, challengeMode, gameType, gameStartTime]);

  useEffect(() => {
    if (challengeMode === 'SPEED_ROUND' && gameState === 'OVER') {
      showToast?.(`Speed Challenge complete! Stats saved to profile.`);
    }
  }, [gameState, challengeMode]);

  const startGame = () => {
    if (gameType === 'SPEED_CHALLENGE') {
      setTimeLeft(120); 
    } else {
      setTimeLeft(0);
    }
    setScore(0);
    setCombo(1);
    setMaxCombo(1);
    setCorrectCount(0);
    setIncorrectCount(0);
    setXpEarned(0);
    setCoinsEarned(0);
    setCurrentPoolIndex(0);
    setFlashState(null);
    setLives(3);
    setGameStartTime(Date.now());
    setGameState('PLAYING');
  };

  const handleAnswerSubmit = (userAnswer: 'accept' | 'reject' | number) => {
    if (gameState !== 'PLAYING') return;
    const activeQuestion = QUESTION_POOL[currentPoolIndex % QUESTION_POOL.length];
    
    let isCorrect = false;
    if (typeof userAnswer === 'number' && activeQuestion.options) {
      isCorrect = userAnswer === activeQuestion.correctIndex;
    } else if (typeof userAnswer === 'string' && activeQuestion.correctAnswer) {
      isCorrect = userAnswer === activeQuestion.correctAnswer;
    }

    if (isCorrect) {
      setFlashState('correct');
      setCorrectCount((prev) => prev + 1);
      
      const points = 100 * combo;
      setScore((prev) => prev + points);
      setXpEarned((prev) => prev + 15);
      setCoinsEarned((prev) => prev + 2);
      awardRewards?.('quiz', `speed_round_q_${activeQuestion.id}`, { isCorrect: true, difficulty: activeQuestion.difficulty });

      setCombo((prev) => {
        const nextCombo = prev + 1;
        if (nextCombo > maxCombo) setMaxCombo(nextCombo);
        return nextCombo;
      });
    } else {
      setFlashState('incorrect');
      setIncorrectCount((prev) => prev + 1);
      setCombo(1);

      if (gameType === 'SPEED_CHALLENGE') {
        setLives((l) => {
          const nextL = Math.max(0, l - 1);
          if (nextL === 0) {
            setGameElapsedTime(Math.round((Date.now() - gameStartTime) / 1000));
            setGameState('OVER');
          }
          return nextL;
        });
      }
    }

    if (gameType === 'PRACTICE_ARENA' && currentPoolIndex >= 9) {
      setTimeout(() => {
        setGameElapsedTime(Math.round((Date.now() - gameStartTime) / 1000));
        setGameState('OVER');
      }, 320);
      return;
    }

    setTimeout(() => {
      setFlashState(null);
      setCurrentPoolIndex((prev) => prev + 1);
    }, 320);
  };

  const activeQuestion = QUESTION_POOL[currentPoolIndex % QUESTION_POOL.length];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const totalLimit = 120;
  const timerPercentage = (timeLeft / totalLimit) * 100;

  if ((challengeMode as string) === 'GAMES') {
    return (
      <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        <MiniGamesHub 
          awardRewards={awardRewards} 
          showToast={showToast} 
          profile={profile}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px 24px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Challenges Center</span>
          <h2 className="view-title" style={{ marginTop: '2px', fontSize: '20px' }}>
            {gameType === 'SPEED_CHALLENGE' ? 'Arcade Speed Challenge' : 'Practice Arena Mode'}
          </h2>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            sessionStorage.removeItem('av_game_type');
            window.location.reload();
          }}
        >
          ← Return to list
        </Button>
      </div>

      <div className="speed-round-container" style={{ width: '100%', maxWidth: '820px' }}>
        
        {gameState === 'START' && (
          <Card glass style={{ padding: '36px 48px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', width: '100%' }}>
            <div style={{ fontSize: '48px' }}>
              {gameType === 'SPEED_CHALLENGE' ? '⚡' : '🎯'}
            </div>
            
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-purple)', fontWeight: 800, letterSpacing: '0.1em' }}>
                {gameType === 'SPEED_CHALLENGE' ? 'Timed Evaluation Protocol' : 'Theory of Computation Practice Arena'}
              </span>
              <h1 style={{ fontSize: '26px', fontWeight: 900, marginTop: '4px' }}>
                {gameType === 'SPEED_CHALLENGE' ? 'Speed Challenge Arena' : 'Interactive Theory Drills'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '520px', margin: '8px auto 0 auto', lineHeight: 1.5 }}>
                {gameType === 'SPEED_CHALLENGE' 
                  ? 'Answer high-level automata problems rapidly before the timer runs out! Maintain your multiplier and protect your arcade shields.' 
                  : 'Solve 10 curated college-level Theory of Computation questions without time limits. Master state transitions, closures, tracing, and minimization.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '24px', background: 'rgba(255,255,255,0.03)', padding: '12px 24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Difficulty</span>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent-cyan)' }}>College Level</div>
              </div>
              <div style={{ width: '1px', background: 'var(--border-subtle)' }} />
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Question Format</span>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent-purple)' }}>Multi-Choice & Tracing</div>
              </div>
              <div style={{ width: '1px', background: 'var(--border-subtle)' }} />
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Reward</span>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#ffc857' }}>+15 XP / +2 Coins</div>
              </div>
            </div>

            <Button variant="primary" size="lg" onClick={startGame} style={{ marginTop: '8px', padding: '0 40px', height: '48px', fontSize: '16px' }} glow>
              Commence Evaluation
            </Button>
          </Card>
        )}

        {gameState === 'PLAYING' && (
          <>
            {gameType === 'SPEED_CHALLENGE' && (
              <div className={`cyber-grid-container ${flashState === 'correct' ? 'flash-correct' : flashState === 'incorrect' ? 'flash-incorrect' : ''}`} style={{ background: 'rgba(9,15,30,0.9)' }}>
                <div className="speed-challenge-lines" />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px', zIndex: 5, position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Arcade Shields</span>
                    <div className="battery-indicator">
                      <div className={`battery-cell ${lives >= 1 ? 'active' : ''}`} />
                      <div className={`battery-cell ${lives >= 2 ? 'active' : ''}`} />
                      <div className={`battery-cell ${lives >= 3 ? 'active' : ''}`} />
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Laser Timer</span>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: timeLeft < 20 ? 'var(--accent-error)' : 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                      {timeFormatted}
                    </div>
                  </div>
                </div>

                <div className="timer-bar-bg" style={{ width: '100%', marginBottom: '20px', zIndex: 5, position: 'relative' }}>
                  <div className={`timer-bar-fill ${timeLeft < 20 ? 'warning' : ''}`} style={{ width: `${timerPercentage}%` }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '20px', zIndex: 5, position: 'relative' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800 }}>
                    SCORE: <span style={{ color: 'var(--accent-cyan)' }}>{score}</span>
                  </div>
                  {combo > 1 && (
                    <div className="combo-flame" style={{ fontSize: '16px' }}>
                      🔥 MULTIPLIER x{combo - 1} ACTIVE!
                    </div>
                  )}
                </div>

                <Card glass style={{ padding: '24px 32px', width: '100%', border: '2px solid var(--accent-cyan)', background: 'var(--bg-hover)', marginBottom: '20px', zIndex: 5, position: 'relative' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 700 }}>Question {currentPoolIndex + 1} ({activeQuestion.alphabet})</span>
                  <h2 style={{ fontSize: '17px', fontWeight: 700, marginTop: '8px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                    {activeQuestion.rule}
                  </h2>
                </Card>

                {activeQuestion.options ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', zIndex: 5, position: 'relative' }}>
                    {activeQuestion.options.map((opt, oIdx) => (
                      <Button
                        key={oIdx}
                        variant="secondary"
                        onClick={() => handleAnswerSubmit(oIdx)}
                        style={{
                          minHeight: '52px',
                          fontSize: '14px',
                          fontWeight: 600,
                          textAlign: 'left',
                          justifyContent: 'flex-start',
                          padding: '12px 16px',
                          background: 'var(--bg-panel)',
                          borderColor: 'var(--border-medium)',
                          color: 'var(--text-main)'
                        }}
                      >
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 800, marginRight: '8px' }}>{String.fromCharCode(65 + oIdx)}.</span> {opt}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '16px', width: '100%', zIndex: 5, position: 'relative' }}>
                    <Button variant="primary" onClick={() => handleAnswerSubmit('accept')} style={{ flex: 1, height: '52px', fontSize: '16px', background: 'var(--accent-success)', borderColor: 'rgba(64,232,122,0.3)' }} glow>
                      Accept Transition (A)
                    </Button>
                    <Button variant="secondary" onClick={() => handleAnswerSubmit('reject')} style={{ flex: 1, height: '52px', fontSize: '16px', background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: 'var(--accent-error)' }}>
                      Reject Transition (R)
                    </Button>
                  </div>
                )}
              </div>
            )}

            {gameType === 'PRACTICE_ARENA' && (
              <div className="game-screen" style={{ background: 'var(--bg-card)', border: '2px solid var(--accent-success)' }}>
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <span>Practice Progress (College Drill Mode)</span>
                    <span>Solved {currentPoolIndex}/10</span>
                  </div>
                  <div className="timer-bar-bg" style={{ width: '100%' }}>
                    <div className="timer-bar-fill" style={{ width: `${(currentPoolIndex / 10) * 100}%`, background: 'var(--accent-success)' }} />
                  </div>
                </div>

                <Card glass style={{ padding: '28px 32px', width: '100%', border: '1.5px solid var(--border-medium)', background: 'var(--bg-hover)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-success)', fontWeight: 800 }}>Practice Drill #{currentPoolIndex + 1}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{activeQuestion.alphabet}</span>
                  </div>
                  <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.5 }}>
                    {activeQuestion.rule}
                  </h2>
                </Card>

                {activeQuestion.options ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
                    {activeQuestion.options.map((opt, oIdx) => (
                      <Button
                        key={oIdx}
                        variant="secondary"
                        onClick={() => handleAnswerSubmit(oIdx)}
                        style={{
                          minHeight: '52px',
                          fontSize: '14px',
                          fontWeight: 600,
                          textAlign: 'left',
                          justifyContent: 'flex-start',
                          padding: '12px 16px',
                          background: 'var(--bg-panel)',
                          borderColor: 'var(--border-medium)',
                          color: 'var(--text-main)'
                        }}
                      >
                        <span style={{ color: 'var(--accent-success)', fontWeight: 800, marginRight: '8px' }}>{String.fromCharCode(65 + oIdx)}.</span> {opt}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                    <Button variant="primary" onClick={() => handleAnswerSubmit('accept')} style={{ flex: 1, height: '48px', fontSize: '15px', background: 'var(--accent-success)' }} glow>
                      Accept string
                    </Button>
                    <Button variant="secondary" onClick={() => handleAnswerSubmit('reject')} style={{ flex: 1, height: '48px', fontSize: '15px' }}>
                      Reject string
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {gameState === 'OVER' && (
          <Card glass style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', width: '100%', border: '2px solid var(--accent-success)' }} className="animate-scale-in">
            <div style={{ fontSize: '20px', color: '#ffc857', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Evaluation Complete
            </div>

            {/* 3 Gold Stars indicator */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', fontSize: '48px' }}>
              <span style={{ animation: 'decFloat 1.2s ease-in-out infinite alternate', animationDelay: '0.1s' }}>⭐</span>
              <span style={{ animation: 'decFloat 1.2s ease-in-out infinite alternate', animationDelay: '0.3s', fontSize: '60px' }}>
                {incorrectCount <= 1 ? '⭐' : '☆'}
              </span>
              <span style={{ animation: 'decFloat 1.2s ease-in-out infinite alternate', animationDelay: '0.5s' }}>
                {incorrectCount === 0 ? '⭐' : '☆'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--accent-success)', fontWeight: 800 }}>Performance Report</span>
              <h2 style={{ fontSize: '28px', fontWeight: 900, marginTop: '2px' }}>
                {gameType === 'SPEED_CHALLENGE' ? 'Speed challenge' 
                 : 'Practice drills'} Cleared
              </h2>
            </div>

            {/* Performance metrics grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%', background: 'var(--bg-hover)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-medium)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>XP Gained</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-success)' }}>+{xpEarned} XP</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Coins Gained</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffc857' }}>🪙 +{coinsEarned}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Accuracy</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  {correctCount + incorrectCount > 0 ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) : 0}%
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Time Elapsed</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>{gameElapsedTime}s</span>
              </div>
            </div>

            {/* Unlocked Badge block */}
            {correctCount >= 8 && (
              <div style={{ background: 'rgba(64,232,122,0.1)', border: '1px solid rgba(64,232,122,0.3)', borderRadius: '12px', padding: '12px', display: 'flex', gap: '12px', alignItems: 'center', width: '100%', textAlign: 'left' }}>
                <span style={{ fontSize: '32px' }}>⚡</span>
                <div>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--accent-success)', fontWeight: 700 }}>New Badge Earned</span>
                  <div style={{ fontSize: '14px', fontWeight: 800 }}>"Speed Evaluator" Badge Unlocked!</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <Button variant="primary" onClick={startGame} style={{ flex: 1, height: '48px' }} glow>
                Replay Challenge
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  sessionStorage.removeItem('av_game_type');
                  window.location.reload();
                }} 
                style={{ flex: 1, height: '48px' }}
              >
                Close Report
              </Button>
            </div>
          </Card>
        )}

      </div>

    </div>
  );
};

export default ChallengesSpeedRound;
