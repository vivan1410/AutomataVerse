import { StateNode, TransitionEdge, minimizeDfa } from './dfaMinimization';

// -------------------------------------------------------------
// Core Conversion Logic Mocked for Testing
// -------------------------------------------------------------

const parseNumber = (s: string) => {
  const match = s.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

const sortStates = (stateIds: string[]) => {
  return [...stateIds].sort((a, b) => {
    const numA = parseNumber(a);
    const numB = parseNumber(b);
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b);
  });
};

const getEpsClosure = (stateIds: string[], edges: TransitionEdge[]): string[] => {
  const closure = new Set<string>(stateIds);
  const queue = [...stateIds];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    edges.forEach(e => {
      if (e.from === curr) {
        const edgeSymbols = e.symbols.flatMap(sym => sym.split(',').map(s => s.trim()));
        if (edgeSymbols.some(cleanSym => cleanSym === '' || cleanSym === 'ε' || cleanSym === 'epsilon')) {
          if (!closure.has(e.to)) {
            closure.add(e.to);
            queue.push(e.to);
          }
        }
      }
    });
  }
  return sortStates(Array.from(closure));
};

const getTransitionMove = (subset: string[], symbol: string, edges: TransitionEdge[]): string[] => {
  const nextStates = new Set<string>();
  subset.forEach(stateId => {
    edges.forEach(e => {
      if (e.from === stateId) {
        const edgeSymbols = e.symbols.flatMap(sym => sym.split(',').map(s => s.trim()));
        if (edgeSymbols.includes(symbol)) {
          nextStates.add(e.to);
        }
      }
    });
  });
  return Array.from(nextStates);
};

export const testNfaToDfa = (
  nodes: StateNode[],
  edges: TransitionEdge[],
  isEpsilon: boolean
): { nodes: StateNode[]; edges: TransitionEdge[] } => {
  const startNode = nodes.find(n => n.isStart);
  if (!startNode) throw new Error("Missing start state");

  const alphabet = Array.from(
    new Set(
      edges.flatMap(e => e.symbols.flatMap(sym => sym.split(',').map(s => s.trim())))
        .filter(sym => sym !== '' && sym !== 'ε' && sym !== 'epsilon')
    )
  ).sort();
  if (alphabet.length === 0) {
    alphabet.push('0', '1');
  }

  const startClosure = isEpsilon ? getEpsClosure([startNode.id], edges) : sortStates([startNode.id]);
  const startKey = startClosure.join(',');

  const explored = new Map<string, string>();
  const unexplored: string[][] = [startClosure];
  const dfaTransitions: { fromKey: string; toKey: string; symbol: string }[] = [];

  const getDfaStateName = (subset: string[]): string => {
    if (subset.length === 0) return 'Ø';
    const key = subset.join(',');
    if (explored.has(key)) return explored.get(key)!;
    return `{${subset.map(id => nodes.find(n => n.id === id)?.name || id).join(',')}}`;
  };

  explored.set(startKey, getDfaStateName(startClosure));

  let iterations = 0;
  while (unexplored.length > 0 && iterations < 150) {
    iterations++;
    const currentSubset = unexplored.shift()!;
    const currentKey = currentSubset.length === 0 ? '__empty_trap__' : currentSubset.join(',');

    alphabet.forEach(symbol => {
      let nextSubset: string[] = [];
      if (currentSubset.length > 0) {
        const moved = getTransitionMove(currentSubset, symbol, edges);
        nextSubset = isEpsilon ? getEpsClosure(moved, edges) : sortStates(moved);
      }

      const nextKey = nextSubset.length > 0 ? nextSubset.join(',') : '__empty_trap__';

      if (!explored.has(nextKey)) {
        explored.set(nextKey, getDfaStateName(nextSubset));
        unexplored.push(nextSubset);
      }

      dfaTransitions.push({
        fromKey: currentKey,
        toKey: nextKey,
        symbol
      });
    });
  }

  let counter = 0;
  const subsetKeys = Array.from(explored.keys());

  const newDfaNodes = subsetKeys.map(key => {
    const subset = key === '__empty_trap__' ? [] : key.split(',');
    const name = explored.get(key)!;
    const id = `Q${counter++}`;
    const isStart = key === startKey;
    const isFinal = key === '__empty_trap__' ? false : subset.some(id => nodes.find(n => n.id === id)?.isFinal);

    return {
      id,
      name: key === '__empty_trap__' ? 'Ø' : name,
      isStart,
      isFinal
    };
  });

  const newDfaEdges: TransitionEdge[] = [];
  dfaTransitions.forEach(trans => {
    const fromNode = newDfaNodes[subsetKeys.indexOf(trans.fromKey)];
    const toNode = newDfaNodes[subsetKeys.indexOf(trans.toKey)];
    if (fromNode && toNode) {
      const existing = newDfaEdges.find(e => e.from === fromNode.id && e.to === toNode.id);
      if (existing) {
        if (!existing.symbols.includes(trans.symbol)) {
          existing.symbols.push(trans.symbol);
        }
      } else {
        newDfaEdges.push({
          id: `e_dfa_${fromNode.id}_${toNode.id}`,
          from: fromNode.id,
          to: toNode.id,
          symbols: [trans.symbol]
        });
      }
    }
  });

  return { nodes: newDfaNodes, edges: newDfaEdges };
};

export const testDfaMinimization = (
  nodes: StateNode[],
  edges: TransitionEdge[]
): { nodes: StateNode[]; edges: TransitionEdge[] } => {
  const result = minimizeDfa(nodes, edges);
  return { nodes: result.nodes, edges: result.edges };
};

export const testRegexToNfa = (regex: string): { nodes: StateNode[]; edges: TransitionEdge[] } => {
  const infixToPostfix = (infix: string): string => {
    let formatted = '';
    for (let i = 0; i < infix.length; i++) {
      const c1 = infix[i];
      formatted += c1;
      if (i + 1 < infix.length) {
        const c2 = infix[i + 1];
        const isC1Symbol = /[a-zA-Z0-9ε]/.test(c1) || c1 === '*' || c1 === ')';
        const isC2Symbol = /[a-zA-Z0-9ε]/.test(c2) || c2 === '(';
        if (isC1Symbol && isC2Symbol) {
          formatted += '.';
        }
      }
    }

    let postfix = '';
    const stack: string[] = [];
    const precedence: Record<string, number> = { '*': 3, '.': 2, '|': 1, '+': 1 };

    for (let i = 0; i < formatted.length; i++) {
      const c = formatted[i];
      if (/[a-zA-Z0-9ε]/.test(c)) {
        postfix += c;
      } else if (c === '(') {
        stack.push(c);
      } else if (c === ')') {
        while (stack.length > 0 && stack[stack.length - 1] !== '(') {
          postfix += stack.pop()!;
        }
        stack.pop();
      } else if (c === '*' || c === '.' || c === '|' || c === '+') {
        while (
          stack.length > 0 &&
          stack[stack.length - 1] !== '(' &&
          precedence[stack[stack.length - 1]] >= precedence[c]
        ) {
          postfix += stack.pop()!;
        }
        stack.push(c);
      }
    }
    while (stack.length > 0) {
      postfix += stack.pop()!;
    }
    return postfix;
  };

  interface Frag { start: StateNode; end: StateNode; nodes: StateNode[]; edges: TransitionEdge[]; }

  const postfix = infixToPostfix(regex);
  const stack: Frag[] = [];
  let stateIdCounter = 0;

  const getNewStateId = () => `t${stateIdCounter++}`;

  for (let i = 0; i < postfix.length; i++) {
    const c = postfix[i];
    if (/[a-zA-Z0-9ε]/.test(c)) {
      const sym = c === 'ε' ? 'ε' : c;
      const s0 = { id: getNewStateId(), name: '', isStart: false, isFinal: false };
      const s1 = { id: getNewStateId(), name: '', isStart: false, isFinal: false };
      const edge = { id: `e_${s0.id}_${s1.id}`, from: s0.id, to: s1.id, symbols: [sym] };
      stack.push({ start: s0, end: s1, nodes: [s0, s1], edges: [edge] });
    } else if (c === '*') {
      const f = stack.pop();
      if (!f) continue;
      const s0 = { id: getNewStateId(), name: '', isStart: false, isFinal: false };
      const s1 = { id: getNewStateId(), name: '', isStart: false, isFinal: false };
      const edgesList = [
        { id: `e_${s0.id}_${f.start.id}`, from: s0.id, to: f.start.id, symbols: ['ε'] },
        { id: `e_${s0.id}_${s1.id}`, from: s0.id, to: s1.id, symbols: ['ε'] },
        { id: `e_${f.end.id}_${f.start.id}`, from: f.end.id, to: f.start.id, symbols: ['ε'] },
        { id: `e_${f.end.id}_${s1.id}`, from: f.end.id, to: s1.id, symbols: ['ε'] }
      ];
      stack.push({ start: s0, end: s1, nodes: [s0, s1, ...f.nodes], edges: [...f.edges, ...edgesList] });
    } else if (c === '|' || c === '+') {
      const f2 = stack.pop();
      const f1 = stack.pop();
      if (!f1 || !f2) continue;
      const s0 = { id: getNewStateId(), name: '', isStart: false, isFinal: false };
      const s1 = { id: getNewStateId(), name: '', isStart: false, isFinal: false };
      const edgesList = [
        { id: `e_${s0.id}_${f1.start.id}`, from: s0.id, to: f1.start.id, symbols: ['ε'] },
        { id: `e_${s0.id}_${f2.start.id}`, from: s0.id, to: f2.start.id, symbols: ['ε'] },
        { id: `e_${f1.end.id}_${s1.id}`, from: f1.end.id, to: s1.id, symbols: ['ε'] },
        { id: `e_${f2.end.id}_${s1.id}`, from: f2.end.id, to: s1.id, symbols: ['ε'] }
      ];
      stack.push({ start: s0, end: s1, nodes: [s0, s1, ...f1.nodes, ...f2.nodes], edges: [...f1.edges, ...f2.edges, ...edgesList] });
    } else if (c === '.') {
      const f2 = stack.pop();
      const f1 = stack.pop();
      if (!f1 || !f2) continue;
      const epsilonEdge = { id: `e_${f1.end.id}_${f2.start.id}`, from: f1.end.id, to: f2.start.id, symbols: ['ε'] };
      stack.push({ start: f1.start, end: f2.end, nodes: [...f1.nodes, ...f2.nodes], edges: [...f1.edges, ...f2.edges, epsilonEdge] });
    }
  }

  const root = stack.pop();
  if (!root) return { nodes: [], edges: [] };

  const uniqueNodesMap = new Map<string, StateNode>();
  root.nodes.forEach(n => {
    if (!uniqueNodesMap.has(n.id)) {
      uniqueNodesMap.set(n.id, { ...n });
    }
  });
  const uniqueNodes = Array.from(uniqueNodesMap.values());

  let stateNum = 0;
  const idMap: Record<string, string> = {};
  const cleanNodes = uniqueNodes.map(n => {
    const cleanId = `q${stateNum++}`;
    idMap[n.id] = cleanId;
    return {
      id: cleanId,
      name: cleanId,
      isStart: n.id === root.start.id,
      isFinal: n.id === root.end.id
    };
  });

  const cleanEdges = root.edges.map(e => ({
    id: `e_${idMap[e.from]}_${idMap[e.to]}`,
    from: idMap[e.from],
    to: idMap[e.to],
    symbols: e.symbols
  }));

  return { nodes: cleanNodes, edges: cleanEdges };
};

// -------------------------------------------------------------
// Assertions and Tests Runners
// -------------------------------------------------------------

export const runAllConversionTests = () => {
  console.log("--- STARTING SYSTEMIC CONVERSION INTEGRITY TESTS ---");

  // Setup sample NFA (divisibility by 3, ending in 01, etc.)
  const nfaNodes: StateNode[] = [
    { id: 'q0', name: 'q0', isStart: true, isFinal: false },
    { id: 'q1', name: 'q1', isStart: false, isFinal: false },
    { id: 'q2', name: 'q2', isStart: false, isFinal: true }
  ];

  const nfaEdges: TransitionEdge[] = [
    { id: 'e1', from: 'q0', to: 'q0', symbols: ['0', '1'] },
    { id: 'e2', from: 'q0', to: 'q1', symbols: ['1'] },
    { id: 'e3', from: 'q1', to: 'q2', symbols: ['0', '1'] }
  ];

  // Test 1: NFA to DFA
  console.log("Running Test 1: NFA -> DFA...");
  const dfaResult = testNfaToDfa(nfaNodes, nfaEdges, false);
  verifyIntegrity("NFA->DFA", dfaResult.nodes, dfaResult.edges);

  // Test 2: ε-NFA to DFA
  console.log("Running Test 2: ε-NFA -> DFA...");
  const enfaNodes = [
    { id: 'A', name: 'A', isStart: true, isFinal: false },
    { id: 'B', name: 'B', isStart: false, isFinal: false },
    { id: 'C', name: 'C', isStart: false, isFinal: true }
  ];
  const enfaEdges = [
    { id: 'e_eps1', from: 'A', to: 'B', symbols: ['ε'] },
    { id: 'e_tr1', from: 'A', to: 'A', symbols: ['0'] },
    { id: 'e_tr2', from: 'B', to: 'C', symbols: ['1'] }
  ];
  const dfaResultFromEnfa = testNfaToDfa(enfaNodes, enfaEdges, true);
  verifyIntegrity("ε-NFA->DFA", dfaResultFromEnfa.nodes, dfaResultFromEnfa.edges);

  // Test 3: DFA Minimization
  console.log("Running Test 3: DFA Minimization...");
  const minResult = testDfaMinimization(dfaResult.nodes, dfaResult.edges);
  verifyIntegrity("DFA->Minimized DFA", minResult.nodes, minResult.edges);

  // Test 4: RE -> NFA Comprehensive Suite (9 expressions)
  console.log("Running Test 4: RE -> NFA (9 Test Expressions)...");
  const testExpressions = ["01", "10", "0", "1", "01|10", "(0|1)", "0*", "1*", "(0|1)*"];
  testExpressions.forEach(re => {
    const reNfa = testRegexToNfa(re);
    verifyIntegrity(`Regex->NFA("${re}")`, reNfa.nodes, reNfa.edges);
    
    // Verify literal symbols present
    const literals = Array.from(re).filter(ch => /[a-zA-Z0-9]/.test(ch));
    const symbolsInNfa = new Set(reNfa.edges.flatMap(e => e.symbols));
    literals.forEach(lit => {
      if (!symbolsInNfa.has(lit)) {
        throw new Error(`[Regex->NFA("${re}")] Missing literal symbol transition '${lit}'`);
      }
    });
  });

  console.log("🎉 ALL INTEGRITY TESTS PASSED SUCCESSFULLY! ZERO ORPHANED EDGES!");
};

const verifyIntegrity = (type: string, nodes: StateNode[], edges: TransitionEdge[]) => {
  const nodeIds = new Set(nodes.map(n => n.id));
  
  // Verify every transition source and target exists
  edges.forEach(edge => {
    if (!nodeIds.has(edge.from)) {
      throw new Error(`[${type}] Transition points from non-existent state ID: ${edge.from}`);
    }
    if (!nodeIds.has(edge.to)) {
      throw new Error(`[${type}] Transition points to non-existent state ID: ${edge.to}`);
    }
  });

  console.log(`[${type}] Verified nodes=${nodes.length}, transitions=${edges.length}. Integrity check passed.`);
};

runAllConversionTests();
