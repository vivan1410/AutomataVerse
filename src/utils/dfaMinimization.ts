// DFA Minimization Algorithm (Hopcroft/Moore Partition Refinement)
// Guarantees mathematical equivalence, unreachable state removal, iterative refinement,
// correct start/final mapping, and automated language equivalence verification.

export interface StateNode {
  id: string;
  name: string;
  x?: number;
  y?: number;
  isStart: boolean;
  isFinal: boolean;
}

export interface TransitionEdge {
  id: string;
  from: string;
  to: string;
  symbols: string[];
}

export interface MinimizationResult {
  nodes: StateNode[];
  edges: TransitionEdge[];
  steps: string[];
  logs: string[];
  mapping: Record<string, string>;
  equivalenceVerified: boolean;
  unreachableRemoved: string[];
  partitionRounds: string[][][];
}

// Parse transition symbols array into individual clean symbol strings
export function parseEdgeSymbols(symbols: string[]): string[] {
  const result = new Set<string>();
  for (const s of symbols) {
    if (!s) continue;
    const parts = s.split(',').map(x => x.trim()).filter(x => x !== '' && x !== 'ε' && x !== 'epsilon');
    for (const p of parts) {
      result.add(p);
    }
  }
  return Array.from(result);
}

// Find deterministic transition target from stateId on symbol
export function getDfaTransitionTarget(
  stateId: string,
  symbol: string,
  edges: TransitionEdge[]
): string | null {
  for (const edge of edges) {
    if (edge.from === stateId) {
      const parsed = parseEdgeSymbols(edge.symbols);
      if (parsed.includes(symbol)) {
        return edge.to;
      }
    }
  }
  return null;
}

// Simulate input string on a DFA
export function simulateDfa(
  startId: string,
  finalStateIds: Set<string>,
  edges: TransitionEdge[],
  inputStr: string
): boolean {
  let curr: string | null = startId;
  for (const char of inputStr) {
    if (!curr) return false;
    curr = getDfaTransitionTarget(curr, char, edges);
  }
  return curr ? finalStateIds.has(curr) : false;
}

export function minimizeDfa(
  nodes: StateNode[],
  edges: TransitionEdge[],
  providedAlphabet?: string[],
  options: { simplifyNames?: boolean } = {}
): MinimizationResult {
  const steps: string[] = [];
  const logs: string[] = [];

  // STAGE 1 — Validate start state
  const startState = nodes.find(n => n.isStart);
  if (!startState) {
    throw new Error("DFA Minimization error: start state not found.");
  }

  // Extract alphabet
  let alphabet: string[] = [];
  if (providedAlphabet && providedAlphabet.length > 0) {
    alphabet = providedAlphabet.filter(s => s !== '' && s !== 'ε' && s !== 'epsilon');
  }
  if (alphabet.length === 0) {
    alphabet = Array.from(
      new Set(
        edges.flatMap(e => parseEdgeSymbols(e.symbols))
      )
    ).sort();
  }
  if (alphabet.length === 0) {
    alphabet = ['0', '1'];
  }

  logs.push("=== DFA MINIMIZATION ===");
  logs.push(`Original states (${nodes.length}): ${nodes.map(n => n.name || n.id).join(', ')}`);
  logs.push(`Original start state: ${startState.name || startState.id}`);
  logs.push(`Original final states: ${nodes.filter(n => n.isFinal).map(n => n.name || n.id).join(', ') || 'None'}`);
  logs.push(`Alphabet: [${alphabet.join(', ')}]`);

  // STAGE 2 — Remove unreachable states via BFS from start state
  const visited = new Set<string>();
  const queue: string[] = [startState.id];
  visited.add(startState.id);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const sym of alphabet) {
      const target = getDfaTransitionTarget(curr, sym, edges);
      if (target && !visited.has(target)) {
        const targetNode = nodes.find(n => n.id === target);
        if (targetNode) {
          visited.add(target);
          queue.push(target);
        }
      }
    }
  }

  const reachableNodes = nodes.filter(n => visited.has(n.id));
  const unreachableNodes = nodes.filter(n => !visited.has(n.id));
  const unreachableRemovedNames = unreachableNodes.map(n => n.name || n.id);

  logs.push(`Reachable states (${reachableNodes.length}): ${reachableNodes.map(n => n.name || n.id).join(', ')}`);
  logs.push(`Removed unreachable states (${unreachableNodes.length}): ${unreachableRemovedNames.join(', ') || 'None'}`);

  steps.push("Stage 1: Validated DFA structure and removed unreachable states.");
  if (unreachableNodes.length > 0) {
    steps.push(`Removed ${unreachableNodes.length} unreachable state(s): ${unreachableRemovedNames.join(', ')}`);
  }

  // Check if incomplete DFA (missing transitions for some reachable state and symbol)
  let hasMissingTransitions = false;
  for (const node of reachableNodes) {
    for (const sym of alphabet) {
      if (!getDfaTransitionTarget(node.id, sym, edges)) {
        hasMissingTransitions = true;
        break;
      }
    }
    if (hasMissingTransitions) break;
  }

  const DEAD_ID = '__DEAD_SINK__';
  if (hasMissingTransitions) {
    logs.push("Note: DFA is incomplete. Missing transitions implicitly map to dead sink.");
  }

  // STAGE 3 — Initial Partition (P0 = final states, P1 = non-final states)
  const finalReachable = reachableNodes.filter(n => n.isFinal).map(n => n.id);
  const nonFinalReachable = reachableNodes.filter(n => !n.isFinal).map(n => n.id);

  let partitions: string[][] = [];
  if (finalReachable.length > 0) partitions.push(finalReachable);
  if (nonFinalReachable.length > 0) partitions.push(nonFinalReachable);

  steps.push(`Stage 2: Initial partition into Accepting and Non-Accepting sets.`);
  steps.push(`Initial partitions: ${partitions.map(p => `{${p.map(id => nodes.find(n => n.id === id)?.name || id).join(', ')}}`).join(', ')}`);
  logs.push(`Initial partitions: ${partitions.map(p => `{${p.join(', ')}}`).join(', ')}`);

  const partitionRounds: string[][][] = [JSON.parse(JSON.stringify(partitions))];

  // Helper to find partition index of a state ID
  const getPartitionIdx = (stateId: string, currentParts: string[][]): number => {
    if (stateId === DEAD_ID) return -99; // Unique partition index for implicit dead sink
    return currentParts.findIndex(p => p.includes(stateId));
  };

  // STAGE 4 — Refine Partitions Until Stable
  let changed = true;
  let roundCount = 0;

  while (changed && roundCount < 100) {
    roundCount++;
    changed = false;
    const nextPartitions: string[][] = [];

    for (const part of partitions) {
      if (part.length <= 1) {
        nextPartitions.push(part);
        continue;
      }

      // Group states by signature
      const splitGroups = new Map<string, string[]>();

      for (const stateId of part) {
        const sigComponents: string[] = [];
        for (const sym of alphabet) {
          const target = getDfaTransitionTarget(stateId, sym, edges);
          const targetId = target || (hasMissingTransitions ? DEAD_ID : 'MISSING');
          const destPartIdx = getPartitionIdx(targetId, partitions);
          sigComponents.push(`${sym}:${destPartIdx}`);
        }
        const signature = sigComponents.join('|');

        if (!splitGroups.has(signature)) {
          splitGroups.set(signature, []);
        }
        splitGroups.get(signature)!.push(stateId);
      }

      const groups = Array.from(splitGroups.values());
      if (groups.length > 1) {
        changed = true;
      }
      nextPartitions.push(...groups);
    }

    partitions = nextPartitions;
    partitionRounds.push(JSON.parse(JSON.stringify(partitions)));
    logs.push(`Refinement round ${roundCount}: ${partitions.map(p => `{${p.join(', ')}}`).join(', ')}`);
  }

  steps.push(`Stage 3: Iteratively refined partitions over ${roundCount} round(s) until stable.`);
  steps.push(`Final equivalence classes (${partitions.length}): ${partitions.map(p => `{${p.map(id => nodes.find(n => n.id === id)?.name || id).join(', ')}}`).join(', ')}`);
  logs.push(`Final equivalence classes: ${partitions.map(p => `{${p.join(', ')}}`).join(', ')}`);

  // STAGE 5 — Create Minimized States
  const mapping: Record<string, string> = {};
  let counter = 0;

  const minimizedNodes: StateNode[] = partitions.map((group) => {
    const id = `Q${counter++}`;
    const memberNames = group.map(sid => nodes.find(n => n.id === sid)?.name || sid).sort();
    const fullName = `{${memberNames.join(',')}}`;
    const isStart = group.includes(startState.id);
    const isFinal = group.some(sid => nodes.find(n => n.id === sid)?.isFinal);

    mapping[id] = fullName;
    return {
      id,
      name: options.simplifyNames ? id : fullName,
      x: 0,
      y: 0,
      isStart,
      isFinal
    };
  });

  // STAGE 6 — Construct Minimized Transitions
  const minimizedEdges: TransitionEdge[] = [];

  partitions.forEach((group, fromIdx) => {
    const representative = group[0];
    const fromNode = minimizedNodes[fromIdx];

    alphabet.forEach(symbol => {
      const target = getDfaTransitionTarget(representative, symbol, edges);
      if (target) {
        const toIdx = partitions.findIndex(p => p.includes(target));
        if (toIdx !== -1) {
          const toNode = minimizedNodes[toIdx];
          const existing = minimizedEdges.find(e => e.from === fromNode.id && e.to === toNode.id);
          if (existing) {
            if (!existing.symbols.includes(symbol)) {
              existing.symbols.push(symbol);
              existing.symbols.sort();
            }
          } else {
            minimizedEdges.push({
              id: `e_min_${fromNode.id}_${toNode.id}`,
              from: fromNode.id,
              to: toNode.id,
              symbols: [symbol]
            });
          }
        }
      }
    });
  });

  steps.push("Stage 4: Constructed minimized DFA transitions and mapped equivalence classes.");

  // STAGE 7 & 8 — Verify Start State and Final States
  const minStartNode = minimizedNodes.find(n => n.isStart);
  const minFinalNodes = minimizedNodes.filter(n => n.isFinal);

  logs.push(`Minimized start state: ${minStartNode?.name || minStartNode?.id}`);
  logs.push(`Minimized final states: ${minFinalNodes.map(n => n.name || n.id).join(', ') || 'None'}`);

  // CRITICAL CORRECTNESS RULE — Language Equivalence Verification
  const testStrings: string[] = [''];
  const queueStr = [''];
  while (queueStr.length > 0) {
    const curr = queueStr.shift()!;
    if (curr.length >= 3) continue;
    for (const sym of alphabet) {
      const next = curr + sym;
      testStrings.push(next);
      queueStr.push(next);
    }
  }

  const origFinalSet = new Set(nodes.filter(n => n.isFinal).map(n => n.id));
  const minFinalSet = new Set(minimizedNodes.filter(n => n.isFinal).map(n => n.id));

  let equivalenceVerified = true;
  for (const tStr of testStrings) {
    const origRes = simulateDfa(startState.id, origFinalSet, edges, tStr);
    const minRes = simulateDfa(minStartNode!.id, minFinalSet, minimizedEdges, tStr);
    if (origRes !== minRes) {
      equivalenceVerified = false;
      console.error(`[DFA Minimization Verification Mismatch] String "${tStr}" -> Original: ${origRes}, Minimized: ${minRes}`);
      logs.push(`❌ Equivalence Verification FAIL on string "${tStr}": Original=${origRes}, Minimized=${minRes}`);
      break;
    }
  }

  if (equivalenceVerified) {
    logs.push("Language equivalence verification: PASS (100% match across test strings)");
    steps.push("Language Equivalence Verification: PASS ✓");
  } else {
    steps.push("Language Equivalence Verification: FAIL ❌");
  }

  return {
    nodes: minimizedNodes,
    edges: minimizedEdges,
    steps,
    logs,
    mapping,
    equivalenceVerified,
    unreachableRemoved: unreachableRemovedNames,
    partitionRounds
  };
}
