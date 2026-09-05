export interface SpeedQuestion {
  id: number;
  alphabet: string;
  rule: string;
  inputString: string;
  correctAnswer: 'accept' | 'reject';
  difficulty: 'Easy' | 'Moderate' | 'Hard';
}

export const ORIGINAL_SPEED_ROUND_POOL: SpeedQuestion[] = [
  {
    id: 1,
    alphabet: 'Σ = {a, b}',
    rule: 'DFA: Design a DFA over Σ={a,b} that accepts strings containing the substring "ab".',
    inputString: 'bab',
    correctAnswer: 'accept',
    difficulty: 'Easy'
  },
  {
    id: 2,
    alphabet: 'Σ = {0, 1}',
    rule: 'DFA: Design a DFA over Σ={0,1} that accepts strings ending with "01".',
    inputString: '101',
    correctAnswer: 'accept',
    difficulty: 'Easy'
  },
  {
    id: 3,
    alphabet: 'Σ = {a, b}',
    rule: 'NFA: Design an NFA over Σ={a,b} where the third symbol is a.',
    inputString: 'bba',
    correctAnswer: 'accept',
    difficulty: 'Easy'
  },
  {
    id: 4,
    alphabet: 'Σ = {0, 1}',
    rule: 'NFA → DFA: Convert an NFA accepting strings ending in "01" into an equivalent DFA using subset construction.',
    inputString: '01',
    correctAnswer: 'accept',
    difficulty: 'Easy'
  },
  {
    id: 5,
    alphabet: 'Σ = {0, 1}',
    rule: 'DFA: Design a DFA over Σ={0,1} accepting binary numbers divisible by 3.',
    inputString: '110',
    correctAnswer: 'accept',
    difficulty: 'Moderate'
  },
  {
    id: 6,
    alphabet: 'Σ = {a, b}',
    rule: 'DFA: Design a DFA over Σ={a,b} where the number of a\'s is even AND the number of b\'s is a multiple of 3.',
    inputString: 'aba',
    correctAnswer: 'reject',
    difficulty: 'Moderate'
  },
  {
    id: 7,
    alphabet: 'Σ = {a, b, c}',
    rule: 'ε-NFA: Design an ε-NFA for the regular expression a*b*c*.',
    inputString: 'abcc',
    correctAnswer: 'accept',
    difficulty: 'Moderate'
  },
  {
    id: 8,
    alphabet: 'Σ = {0, 1}',
    rule: 'NFA → DFA: Convert an NFA accepting strings that start with 0 and end with 1, with arbitrary symbols in the middle, into a DFA using subset construction.',
    inputString: '010',
    correctAnswer: 'reject',
    difficulty: 'Moderate'
  },
  {
    id: 9,
    alphabet: 'Σ = {0, 1}',
    rule: 'DFA: Design a DFA over Σ={0,1} accepting strings whose third symbol from the right is 1.',
    inputString: '100',
    correctAnswer: 'accept',
    difficulty: 'Hard'
  },
  {
    id: 10,
    alphabet: 'Σ = {a, b}',
    rule: 'NFA → DFA: Convert NFA (states {q0,q1,q2,q3}, alphabet {a,b}, start q0, final {q3}, δ(q0,a)={q0,q1}, δ(q0,b)={q0}, δ(q1,a)={q2}, δ(q1,b)={q2}, δ(q2,a)={q3}, δ(q2,b)={q3}) into equivalent DFA.',
    inputString: 'aba',
    correctAnswer: 'accept',
    difficulty: 'Hard'
  },
  {
    id: 11,
    alphabet: 'Σ = {0, 1}',
    rule: 'ε-NFA → DFA: Convert ε-NFA (states {A,B,C}, alphabet {0,1}, start A, final {C}, δ(A,ε)={B}, δ(A,0)={A}, δ(B,1)={C}, δ(C,ε)={A}, δ(C,0)={B}) into equivalent DFA.',
    inputString: '0',
    correctAnswer: 'reject',
    difficulty: 'Hard'
  }
];
