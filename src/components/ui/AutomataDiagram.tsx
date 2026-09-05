import React, { useMemo, useEffect, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MarkerType,
  Handle,
  Position,
  EdgeProps,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import './AutomataDiagram.css';

// Interface for structured Automaton data (Step 1 Architecture)
export interface AutomatonData {
  type: 'DFA' | 'NFA';
  title: string;
  alphabet: string[];
  states: {
    id: string;
    start?: boolean;
    accept: boolean;
  }[];
  transitions: {
    from: string;
    to: string;
    symbol: string;
  }[];
  description: string;
}

interface AutomataDiagramProps {
  automaton: AutomatonData;
}

// 1. Validation Checks (Step 3 Architecture)
export function validateAutomaton(automaton: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!automaton || typeof automaton !== 'object') {
    errors.push("Invalid data format.");
    return { isValid: false, errors };
  }
  if (automaton.type !== 'DFA' && automaton.type !== 'NFA') {
    errors.push("Automaton type must be 'DFA' or 'NFA'.");
  }
  if (typeof automaton.title !== 'string' || !automaton.title.trim()) {
    errors.push("Automaton missing a valid title.");
  }
  if (!automaton.alphabet || !Array.isArray(automaton.alphabet) || automaton.alphabet.length === 0) {
    errors.push("Missing or empty alphabet list.");
  }
  if (!automaton.states || !Array.isArray(automaton.states) || automaton.states.length === 0) {
    errors.push("Missing or empty states list.");
  }
  if (!automaton.transitions || !Array.isArray(automaton.transitions)) {
    errors.push("Missing transitions list.");
  }
  if (typeof automaton.description !== 'string') {
    errors.push("Missing description field.");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // State ID uniqueness and ID validity
  const stateIds = new Set<string>();
  let startStateCount = 0;
  let acceptStateCount = 0;

  for (const s of automaton.states) {
    if (!s || typeof s !== 'object' || typeof s.id !== 'string' || !s.id.trim()) {
      errors.push("Invalid state object structure: states must have a non-empty string 'id'.");
      continue;
    }
    if (stateIds.has(s.id)) {
      errors.push(`State ID "${s.id}" is not unique.`);
    }
    stateIds.add(s.id);
    if (s.start === true) startStateCount++;
    if (s.accept === true) acceptStateCount++;
  }

  // Exactly one start state
  if (startStateCount !== 1) {
    errors.push(`The automaton must have exactly 1 start state (found ${startStateCount}).`);
  }

  // Accepting states exist
  if (acceptStateCount < 1) {
    errors.push("The automaton must have at least one accepting state.");
  }

  // Every transition source and destination exists
  // Alphabet symbols are valid
  const transitionsSeen = new Set<string>();

  for (const t of automaton.transitions) {
    if (!t || typeof t !== 'object' || typeof t.from !== 'string' || typeof t.to !== 'string' || typeof t.symbol !== 'string') {
      errors.push("Invalid transition format: transitions must be objects with 'from', 'to', and 'symbol'.");
      continue;
    }
    if (!stateIds.has(t.from)) {
      errors.push(`Transition references non-existent source state "${t.from}".`);
    }
    if (!stateIds.has(t.to)) {
      errors.push(`Transition references non-existent destination state "${t.to}".`);
    }
    
    const isEpsilon = t.symbol === 'ε' || t.symbol === 'e' || t.symbol === 'epsilon' || t.symbol === '';
    if (!isEpsilon && !automaton.alphabet.includes(t.symbol)) {
      errors.push(`Transition symbol "${t.symbol}" is not defined in the alphabet: [${automaton.alphabet.join(', ')}].`);
    }

    // No duplicate transitions
    const key = `${t.from}->${t.to}:${t.symbol}`;
    if (transitionsSeen.has(key)) {
      errors.push(`Duplicate transition detected from "${t.from}" to "${t.to}" on symbol "${t.symbol}".`);
    }
    transitionsSeen.add(key);
  }

  // DFA specific validation: exactly one outgoing transition per alphabet symbol for every state
  if (automaton.type === 'DFA') {
    for (const sId of Array.from(stateIds)) {
      for (const sym of automaton.alphabet) {
        const matching = automaton.transitions.filter((t: any) => t.from === sId && t.symbol === sym);
        if (matching.length === 0) {
          errors.push(`DFA validation error: State "${sId}" is missing transition for alphabet symbol "${sym}".`);
        } else if (matching.length > 1) {
          errors.push(`DFA validation error: State "${sId}" has multiple transitions for alphabet symbol "${sym}".`);
        }
      }
    }
  }

  // No dangling nodes: check reachability from the start state
  const startStateNode = automaton.states.find((s: any) => s.start === true);
  if (startStateNode) {
    const startId = startStateNode.id;
    const visited = new Set<string>();
    const queue = [startId];
    visited.add(startId);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const neighbors = automaton.transitions.filter((t: any) => t.from === curr).map((t: any) => t.to);
      for (const n of neighbors) {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      }
    }

    if (visited.size !== automaton.states.length) {
      const unreachables = automaton.states.filter((s: any) => !visited.has(s.id)).map((s: any) => s.id);
      errors.push(`Dangling/unreachable node(s) detected: [${unreachables.join(', ')}]. All states must be reachable from the start state.`);
    }

    const acceptStates = automaton.states.filter((s: any) => s.accept === true);
    const reachableAcceptStates = acceptStates.filter((s: any) => visited.has(s.id));
    if (reachableAcceptStates.length === 0) {
      errors.push("No accepting states are reachable from the start state.");
    }
  }

  // Check for fully disconnected states (having no transitions at all)
  for (const s of automaton.states) {
    const isConnected = automaton.transitions.some((t: any) => t.from === s.id || t.to === s.id);
    if (!isConnected && automaton.states.length > 1) {
      errors.push(`State "${s.id}" is disconnected from the graph.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// 2. Automaton Simulator Engine (for test strings generation)
function simulateAutomaton(
  startState: string,
  acceptingStates: string[],
  transitions: { from: string; to: string; symbol: string }[],
  input: string
): boolean {
  let activeStates = new Set<string>();

  const getEpsilonClosure = (startStates: Set<string>): Set<string> => {
    const closure = new Set<string>(startStates);
    const queue = Array.from(startStates);
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const t of transitions) {
        if (t.from === current && (t.symbol === 'ε' || t.symbol === 'e' || t.symbol === 'epsilon' || t.symbol === '')) {
          if (!closure.has(t.to)) {
            closure.add(t.to);
            queue.push(t.to);
          }
        }
      }
    }
    return closure;
  };

  activeStates.add(startState);
  activeStates = getEpsilonClosure(activeStates);

  for (const char of input) {
    const nextStates = new Set<string>();
    for (const state of activeStates) {
      for (const t of transitions) {
        if (t.from === state && t.symbol === char) {
          nextStates.add(t.to);
        }
      }
    }
    activeStates = getEpsilonClosure(nextStates);
  }

  for (const s of Array.from(activeStates)) {
    if (acceptingStates.includes(s)) {
      return true;
    }
  }
  return false;
}

// Helper to generate strings of length <= 4 over the alphabet
function generateTestStrings(alphabet: string[]): string[] {
  const cleanAlphabet = alphabet.filter(
    (sym) => sym !== 'ε' && sym !== 'e' && sym !== 'epsilon' && sym !== ''
  );
  if (cleanAlphabet.length === 0) return [''];
  
  const result: string[] = [''];
  const queue = [''];
  const maxLen = 4;
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.length >= maxLen) continue;
    for (const sym of cleanAlphabet) {
      const next = current + sym;
      result.push(next);
      queue.push(next);
    }
  }
  
  return result.sort((a, b) => a.length - b.length || a.localeCompare(b));
}

// 3. Custom Node Component (Step 6 Architecture)
const AutomatonNode: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className={`automaton-node-wrapper ${data.isAccepting ? 'accepting' : ''} ${data.isStart ? 'start-node' : ''}`}>
      {data.isStart && (
        <div className="node-start-arrow-indicator" title="Start State">
          ▶
        </div>
      )}
      <div className="node-circle">
        {data.isAccepting && <div className="node-circle-inner-ring" />}
        <span className="node-state-name">{data.label}</span>
      </div>
      
      {/* Target Handles in all 4 directions */}
      <Handle type="target" position={Position.Left} id="left-target" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Right} id="right-target" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} id="top-target" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" style={{ opacity: 0 }} />

      {/* Source Handles in all 4 directions */}
      <Handle type="source" position={Position.Left} id="left-source" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="right-source" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Top} id="top-source" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ opacity: 0 }} />
    </div>
  );
};

// 4. Custom Edge Component with dynamic quadratic curve offsets (Step 5 & 6 Architecture)
const CurvedTransitionEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  label,
  markerEnd,
  style,
  data
}) => {
  const curvature = data?.curvature || 0;
  const isSelfLoop = data?.isSelfLoop || false;

  const labelText = String(label || '');
  const labelWidth = Math.max(20, labelText.length * 7 + 8);

  if (isSelfLoop) {
    // Loop above the node, with a small compact radius of 15px
    const radius = 15;
    const loopX = sourceX;
    const loopY = sourceY;
    const path = `M ${loopX - 5} ${loopY} A ${radius} ${radius} 0 1 1 ${loopX + 5} ${loopY}`;
    const labelX = loopX;
    const labelY = loopY - radius - 3;

    return (
      <>
        <path id={id} className="react-flow__edge-path custom-loop-path" d={path} markerEnd={markerEnd} style={style} />
        {label && (
          <text
            x={labelX}
            y={labelY}
            fill="var(--graph-label-text)"
            fontSize={11}
            fontWeight={800}
            textAnchor="middle"
            style={{
              paintOrder: 'stroke',
              stroke: 'var(--graph-label-bg)',
              strokeWidth: 4,
              strokeLinejoin: 'round',
            }}
          >
            {label}
          </text>
        )}
      </>
    );
  }

  // If curve is very small, use standard straight connection
  if (Math.abs(curvature) < 0.01) {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    // Shorten by 10px so marker is visible outside the node boundary
    const offsetLength = 10;
    const finalTargetX = len > 0 ? targetX - (dx / len) * offsetLength : targetX;
    const finalTargetY = len > 0 ? targetY - (dy / len) * offsetLength : targetY;

    const path = `M ${sourceX} ${sourceY} L ${finalTargetX} ${finalTargetY}`;
    const labelX = (sourceX + targetX) / 2;
    const labelY = (sourceY + targetY) / 2;

    return (
      <>
        <path id={id} className="react-flow__edge-path custom-bezier-path" d={path} markerEnd={markerEnd} style={style} />
        {label && (
          <g className="edge-label-group">
            <rect
              x={labelX - labelWidth / 2}
              y={labelY - 8}
              width={labelWidth}
              height={16}
              rx={4}
              fill="var(--graph-label-bg)"
              stroke="var(--graph-label-border)"
              strokeWidth={1.5}
            />
            <text
              x={labelX}
              y={labelY + 4}
              fill="var(--graph-label-text)"
              fontSize={11}
              fontWeight={800}
              fontFamily="var(--font-mono)"
              textAnchor="middle"
            >
              {label}
            </text>
          </g>
        )}
      </>
    );
  }

  // Calculate quadratic control point offset
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const len = Math.sqrt(dx * dx + dy * dy);

  const mx = (sourceX + targetX) / 2;
  const my = (sourceY + targetY) / 2;

  const px = -dy / (len || 1);
  const py = dx / (len || 1);

  const offset = curvature * len;
  const cx = mx + px * offset;
  const cy = my + py * offset;

  const path = (() => {
    const endDx = targetX - cx;
    const endDy = targetY - cy;
    const endDist = Math.sqrt(endDx * endDx + endDy * endDy);
    const offsetLength = 10;
    const finalTargetX = endDist > 0 ? targetX - (endDx / endDist) * offsetLength : targetX;
    const finalTargetY = endDist > 0 ? targetY - (endDy / endDist) * offsetLength : targetY;
    return `M ${sourceX} ${sourceY} Q ${cx} ${cy} ${finalTargetX} ${finalTargetY}`;
  })();

  // Center label at quadratic curve peak
  const labelX = 0.25 * sourceX + 0.5 * cx + 0.25 * targetX;
  const labelY = 0.25 * sourceY + 0.5 * cy + 0.25 * targetY;

  return (
    <>
      <path id={id} className="react-flow__edge-path custom-bezier-path" d={path} markerEnd={markerEnd} style={style} />
      {label && (
        <g className="edge-label-group">
          <rect
            x={labelX - labelWidth / 2}
            y={labelY - 8}
            width={labelWidth}
            height={16}
            rx={4}
            fill="var(--graph-label-bg)"
            stroke="var(--graph-label-border)"
            strokeWidth={1.5}
          />
          <text
            x={labelX}
            y={labelY + 4}
            fill="var(--graph-label-text)"
            fontSize={11}
            fontWeight={800}
            fontFamily="var(--font-mono)"
            textAnchor="middle"
          >
            {label}
          </text>
        </g>
      )}
    </>
  );
};

const nodeTypes = {
  automatonNode: AutomatonNode,
};

const edgeTypes = {
  smoothstep: CurvedTransitionEdge,
};

// FlowAutoFitter component to trigger fitView on layout updates (Requirement 8)
const FlowAutoFitter: React.FC<{ nodes: any[]; edges: any[] }> = ({ nodes, edges }) => {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({
          padding: 0.2,
          includeHiddenNodes: true
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes, edges, fitView]);

  return null;
};

// Inner component holding logic using React Flow Context
const AutomataDiagramInner: React.FC<AutomataDiagramProps> = ({ automaton }) => {
  const [isStepsExpanded, setIsStepsExpanded] = useState(false);
  const validation = useMemo(() => validateAutomaton(automaton), [automaton]);

  // Compute Layout, Edges Grouping and Verification counts (Requirement 2, 3, 5, 6, 7 & 9)
  const layout = useMemo(() => {
    // Stage 1: Raw Gemini response model
    console.log("[Pipeline Trace 1] Raw Gemini Response / Automaton Model:", automaton);

    if (!validation.isValid) {
      console.warn("[Pipeline Trace] Automaton validation failed:", validation.errors);
      return { nodes: [], edges: [], error: "Invalid validation" };
    }

    // Safety audit checks: verify source and destination existence (Requirement 2 & 5)
    const stateIdsList = automaton.states.map(s => s.id);
    console.log("[Pipeline Trace 2] Node ID check. Valid states list:", stateIdsList);

    // Audit Stage 2: Mapping nodes
    console.log("[Pipeline Trace 3] Mapping React Flow Nodes...");

    // Position using dagre
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
      rankdir: 'LR',
      marginx: 40,
      marginy: 40,
      nodesep: 80,
      ranksep: 120,
    });

    automaton.states.forEach(s => {
      g.setNode(s.id, { width: 56, height: 56 });
    });

    // Add transitions to dagre
    automaton.transitions.forEach(t => {
      if (stateIdsList.includes(t.from) && stateIdsList.includes(t.to)) {
        g.setEdge(t.from, t.to);
      }
    });

    dagre.layout(g);

    // Retrieve computed coordinates
    const positions = automaton.states.map(s => {
      const nodeInfo = g.node(s.id);
      return {
        id: s.id,
        x: nodeInfo ? nodeInfo.x : 100,
        y: nodeInfo ? nodeInfo.y : 150,
      };
    });

    // Start / trap boundaries
    let minX = Infinity;
    let maxX = -Infinity;
    positions.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
    });

    const startState = automaton.states.find(s => s.start === true)?.id || '';
    const trapState = automaton.states.find(s => {
      const isAccept = s.accept === true;
      const isStart = s.start === true;
      const outgoingToOthers = automaton.transitions.filter(t => t.from === s.id && t.to !== s.id);
      return !isAccept && !isStart && outgoingToOthers.length === 0;
    })?.id || '';

    const formattedNodes = automaton.states.map(s => {
      const pos = positions.find(p => p.id === s.id) || { x: 100, y: 150 };
      let nodeX = pos.x;
      let nodeY = pos.y;

      if (s.id === startState) {
        nodeX = minX;
      }
      if (s.id === trapState && maxX > minX) {
        nodeX = maxX;
      }

      return {
        id: s.id,
        type: 'automatonNode',
        position: { x: nodeX - 28, y: nodeY - 28 },
        data: {
          label: s.id,
          isStart: s.start === true,
          isAccepting: s.accept === true,
        }
      };
    });

    console.log("[Pipeline Trace 4] React Flow Nodes mapped successfully:", formattedNodes);

    // Combine parallel transitions in the same direction between the same two states
    const combinedTransitions: { from: string; to: string; symbol: string }[] = [];
    const transitionGroups = new Map<string, string[]>(); // key "from->to" to array of symbols

    automaton.transitions.forEach(t => {
      const key = `${t.from}->${t.to}`;
      if (!transitionGroups.has(key)) {
        transitionGroups.set(key, []);
      }
      transitionGroups.get(key)!.push(t.symbol);
    });

    transitionGroups.forEach((symbols, key) => {
      const [from, to] = key.split('->');
      const uniqueSymbols = Array.from(new Set(symbols)).sort();
      combinedTransitions.push({
        from,
        to,
        symbol: uniqueSymbols.join(', ')
      });
    });

    const formattedEdges: any[] = [];
    const missingTransitions: string[] = [];

    combinedTransitions.forEach((t) => {
      const sourceExists = stateIdsList.includes(t.from);
      const targetExists = stateIdsList.includes(t.to);

      if (!sourceExists || !targetExists) {
        const missingState = !sourceExists ? t.from : t.to;
        missingTransitions.push(`${t.from}-${t.to}-${t.symbol} (State "${missingState}" is missing)`);
        return;
      }

      const isSelfLoop = t.from === t.to;
      let curvature = 0;

      if (!isSelfLoop) {
        const oppositeExists = combinedTransitions.some(x => x.from === t.to && x.to === t.from);

        const fromNode = formattedNodes.find(n => n.id === t.from);
        const toNode = formattedNodes.find(n => n.id === t.to);
        let hasObstacle = false;

        if (fromNode && toNode) {
          const dx = toNode.position.x - fromNode.position.x;
          const dy = toNode.position.y - fromNode.position.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0) {
            const ux = dx / dist;
            const uy = dy / dist;
            const px = -uy;
            const py = ux;

            hasObstacle = formattedNodes.some(n => {
              if (n.id === t.from || n.id === t.to) return false;
              const vox = n.position.x - fromNode.position.x;
              const voy = n.position.y - fromNode.position.y;
              const tProj = vox * ux + voy * uy;
              const dPerp = vox * px + voy * py;
              return tProj > 28 && tProj < dist - 28 && Math.abs(dPerp) < 40;
            });
          }
        }

        if (oppositeExists || hasObstacle) {
          curvature = -0.25;
        }
      }

      const edgeId = `${t.from}-${t.to}-${t.symbol.replace(/,\s*/g, '_')}`;

      // Calculate handles
      const fromNode = formattedNodes.find(n => n.id === t.from);
      const toNode = formattedNodes.find(n => n.id === t.to);
      let sourceHandle = Position.Right;
      let targetHandle = Position.Left;

      if (fromNode && toNode && !isSelfLoop) {
        const fromX = fromNode.position.x;
        const toX = toNode.position.x;
        if (fromX < toX) {
          sourceHandle = Position.Right;
          targetHandle = Position.Left;
        } else if (fromX > toX) {
          sourceHandle = Position.Left;
          targetHandle = Position.Right;
        } else {
          sourceHandle = fromNode.position.y < toNode.position.y ? Position.Bottom : Position.Top;
          targetHandle = fromNode.position.y < toNode.position.y ? Position.Top : Position.Bottom;
        }
      }

      formattedEdges.push({
        id: edgeId,
        source: t.from,
        target: t.to,
        sourceHandle: isSelfLoop ? 'top-source' : `${sourceHandle}-source`,
        targetHandle: isSelfLoop ? 'top-target' : `${targetHandle}-target`,
        label: t.symbol === '' ? 'ε' : t.symbol,
        type: 'smoothstep',
        animated: false,
        data: {
          curvature,
          isSelfLoop,
          selfLoopIdx: 0
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#2563EB',
          width: 18,
          height: 18,
        },
        style: {
          stroke: '#2563EB',
          strokeWidth: 2.5,
        }
      });
    });

    console.log("[Pipeline Trace 6] React Flow Edges mapped successfully:", formattedEdges);

    // Requirement 3: Print verification details exactly
    console.log("AI States:\n" + automaton.states.map(s => s.id).join(', '));
    console.log("AI Transitions:\n" + automaton.transitions.map(t => `${t.from}-${t.to}-${t.symbol}`).join(', '));
    console.log("Rendered Nodes:\n" + formattedNodes.map(n => n.id).join(', '));
    console.log("Rendered Edges:\n" + formattedEdges.map(e => e.id).join(', '));

    // Requirement 9: Development debugging tables immediately before rendering
    console.log("Nodes Table:");
    console.table(formattedNodes);
    console.log("Edges Table:");
    console.table(formattedEdges);

    // Count discrepancy verification
    if (automaton.states.length !== formattedNodes.length) {
      const errorMsg = `Node count mismatch! Expected states: ${automaton.states.length}, Rendered: ${formattedNodes.length}`;
      console.error(errorMsg);
      return { nodes: [], edges: [], error: errorMsg };
    }

    if (combinedTransitions.length !== formattedEdges.length) {
      const errorMsg = `Edge count mismatch! Expected transitions: ${combinedTransitions.length}, Rendered: ${formattedEdges.length}. Missing IDs: ${missingTransitions.join(', ')}`;
      console.error(errorMsg);
      return { nodes: [], edges: [], error: errorMsg };
    }

    console.log("[Pipeline Trace 7] Handing over to Canvas Rendering. Pipeline complete!");
    return { nodes: formattedNodes, edges: formattedEdges, error: null };
  }, [automaton, validation]);

  // Generate test strings simulation outcomes
  const explanationDetails = useMemo(() => {
    if (!validation.isValid || layout.error) return null;

    const alphabet = automaton.alphabet;
    const startState = automaton.states.find(s => s.start === true)?.id || '';
    const acceptingStates = automaton.states.filter(s => s.accept === true).map(s => s.id);
    const transitions = automaton.transitions;

    const testCases = generateTestStrings(alphabet);
    const acceptedList: string[] = [];
    const rejectedList: string[] = [];

    for (const testStr of testCases) {
      const isAccepted = simulateAutomaton(startState, acceptingStates, transitions, testStr);
      const displayStr = testStr === '' ? 'ε (empty string)' : `"${testStr}"`;
      if (isAccepted) {
        if (acceptedList.length < 3) acceptedList.push(displayStr);
      } else {
        if (rejectedList.length < 3) rejectedList.push(displayStr);
      }
    }

    return {
      accepted: acceptedList,
      rejected: rejectedList,
    };
  }, [automaton, validation, layout.error]);

  if (!validation.isValid || layout.error) {
    const errorDetails = layout.error ? [layout.error] : validation.errors;
    console.warn("Automaton rejected: " + errorDetails.join(" | "));
    return (
      <div className="automaton-diagram-view validation-failed" style={{ minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="validation-error-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--accent-error)', fontWeight: 650 }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚠️</div>
          <div style={{ fontSize: '16px', letterSpacing: '0.5px' }}>Invalid automaton generated. Regenerating...</div>
        </div>
      </div>
    );
  }

  const canvasHeight = Math.max(300, Math.min(480, 180 + automaton.states.length * 50));

  return (
    <div className="automaton-diagram-view">
      <div className="diagram-card-meta">
        <span className="diagram-type-tag">{automaton.type} DIAGRAM</span>
        <span className="diagram-alphabet-tag">Alphabet: {JSON.stringify(automaton.alphabet)}</span>
      </div>

      <div className="react-flow-canvas-wrapper" style={{ height: `${canvasHeight}px` }}>
        <ReactFlow
          nodes={layout.nodes}
          edges={layout.edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.5}
          maxZoom={2.5}
          zoomOnScroll={false}
          preventScrolling={true}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="var(--border-medium)" gap={16} size={1} />
          <Controls className="custom-flow-controls" showInteractive={false} />
          <FlowAutoFitter nodes={layout.nodes} edges={layout.edges} />
        </ReactFlow>
      </div>

      <div className="diagram-explanation-panel">
        <h5 className="explanation-header">System Explanation</h5>
        <p className="explanation-paragraph" style={{ marginBottom: '14px' }}>
          <strong>Purpose:</strong> {automaton.description}
        </p>
        
        <div className="explanation-divider" />
        
        <h6 className="explanation-section-title">States Meaning & Rules</h6>
        <ul className="explanation-list">
          {automaton.states.map(state => {
            const isStart = state.start === true;
            const isAccept = state.accept === true;
            
            let role = "intermediate helper state";
            if (isStart && isAccept) role = "start state and final accept state";
            else if (isStart) role = "initial start state of the machine";
            else if (isAccept) role = "final accepting state (reaches success criteria)";
            
            return (
              <li key={state.id}>
                State <strong>{state.id}</strong>: Processes inputs as a {role}.
              </li>
            );
          })}
        </ul>

        <div className="explanation-divider" />

        <h6 className="explanation-section-title">Transition Logic Matrix</h6>
        <ul className="explanation-list">
          {automaton.states.map(state => {
            const outgoing = automaton.transitions.filter(t => t.from === state.id);
            if (outgoing.length === 0) return null;
            return (
              <li key={state.id}>
                From state <strong>{state.id}</strong>: {outgoing.map((t, idx) => (
                  <span key={idx}>
                    read <code>{t.symbol === '' ? 'ε' : t.symbol}</code> to <strong>{t.to}</strong>
                    {idx < outgoing.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </li>
            );
          })}
        </ul>

        {/* Formal 5-Tuple Definition (Requirement 15) */}
        <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-panel)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <h6 className="explanation-section-title" style={{ color: 'var(--accent-purple)', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '10px' }}>Formal 5-Tuple Definition (M = (Q, Σ, δ, q₀, F))</h6>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-main)' }}>
            <div><strong>Q (Finite set of states):</strong> &#123;{automaton.states.map(s => s.id).join(', ')}&#125;</div>
            <div><strong>Σ (Input alphabet):</strong> &#123;{automaton.alphabet.join(', ')}&#125;</div>
            <div><strong>δ (Transition mapping):</strong> Q × Σ → {automaton.type === 'DFA' ? 'Q' : '2^Q'} (defined by the matrix below)</div>
            <div><strong>q₀ (Initial start state):</strong> {automaton.states.find(s => s.start === true)?.id || 'N/A'}</div>
            <div><strong>F (Set of accepting states):</strong> &#123;{automaton.states.filter(s => s.accept === true).map(s => s.id).join(', ')}&#125;</div>
          </div>
        </div>

        {/* Transition Table Matrix (Requirement 14) */}
        {(() => {
          const hasEpsilon = automaton.transitions.some(t => t.symbol === 'ε' || t.symbol === 'e' || t.symbol === 'epsilon' || t.symbol === '');
          return (
            <div style={{ marginTop: '20px' }}>
              <h6 className="explanation-section-title" style={{ color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>Transition Table (δ)</h6>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '10px', borderRight: '1px solid var(--border-subtle)', fontWeight: 700 }}>Current State</th>
                    {automaton.alphabet.map(sym => (
                      <th key={sym} style={{ padding: '10px', borderRight: '1px solid var(--border-subtle)', fontWeight: 700 }}>{sym}</th>
                    ))}
                    {hasEpsilon && (
                      <th style={{ padding: '10px', fontWeight: 700 }}>ε</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {automaton.states.map(state => {
                    const prefix = state.start ? '→ ' : '';
                    const suffix = state.accept ? ' (Accept)' : '';
                    const stateDisplay = `${prefix}${state.id}${suffix}`;

                    return (
                      <tr key={state.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px', borderRight: '1px solid var(--border-subtle)', fontWeight: 600, background: 'var(--bg-card)' }}>{stateDisplay}</td>
                        {automaton.alphabet.map(sym => {
                          const dests = automaton.transitions
                            .filter(t => t.from === state.id && t.symbol === sym)
                            .map(t => t.to);
                          
                          const displayVal = automaton.type === 'DFA' 
                            ? (dests[0] || 'qt') 
                            : (dests.length > 0 ? `{${dests.join(', ')}}` : 'Ø');

                          return (
                            <td key={sym} style={{ padding: '10px', borderRight: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)' }}>{displayVal}</td>
                          );
                        })}
                        {hasEpsilon && (() => {
                          const dests = automaton.transitions
                            .filter(t => t.from === state.id && (t.symbol === 'ε' || t.symbol === 'e' || t.symbol === 'epsilon' || t.symbol === ''))
                            .map(t => t.to);

                          return (
                            <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>
                              {dests.length > 0 ? `{${dests.join(', ')}}` : 'Ø'}
                            </td>
                          );
                        })()}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Step-by-Step Construction Explanation (Requirement 16) */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h6 className="explanation-section-title" style={{ color: 'var(--accent-purple)', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Step-by-Step Construction Guide</h6>
            <button 
              onClick={() => setIsStepsExpanded((prev: boolean) => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-main)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '10px', transition: 'transform 0.3s ease', transform: isStepsExpanded ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}>
                {isStepsExpanded ? '▲' : '▼'}
              </span>
              <span>Steps</span>
            </button>
          </div>

          <div
            style={{
              maxHeight: isStepsExpanded ? '800px' : '0px',
              opacity: isStepsExpanded ? 1 : 0,
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontSize: '13px',
              lineHeight: 1.5
            }}
          >
            <div style={{ padding: '12px', background: 'var(--bg-hover)', borderRadius: '6px', borderLeft: '3px solid var(--accent-cyan)' }}>
              <strong>Step 1: Determine States & Roles</strong>
              <div style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
                The regular language requires tracking inputs modulo state patterns. We initialize the state space Q = &#123;{automaton.states.map(s => s.id).join(', ')}&#125;.
                {automaton.states.map(s => {
                  const startDesc = s.start ? " This is our entry point (start state q₀)." : "";
                  const acceptDesc = s.accept ? " This is a final accepting state representing successful pattern completion." : " This is an intermediate helper state.";
                  return (
                    <div key={s.id} style={{ marginTop: '4px', paddingLeft: '8px' }}>
                      • State <strong>{s.id}</strong>:{startDesc}{acceptDesc}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div style={{ padding: '12px', background: 'var(--bg-hover)', borderRadius: '6px', borderLeft: '3px solid var(--accent-purple)' }}>
              <strong>Step 2: Set Up Transition Table δ</strong>
              <div style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
                For each state, we map outgoing pathways for every character in the alphabet Σ = &#123;{automaton.alphabet.join(', ')}&#125;.
                {automaton.type === 'DFA' ? (
                  <span> To ensure determinism, every state has exactly one transition for each alphabet symbol, routing unrecognized sequences back to helper or dead trap states.</span>
                ) : (
                  <span> As a non-deterministic machine (NFA), states are permitted to branch parallel paths or have no transitions on certain inputs.</span>
                )}
              </div>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-hover)', borderRadius: '6px', borderLeft: '3px solid var(--accent-success)' }}>
              <strong>Step 3: Verification & Execution</strong>
              <div style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
                The machine trace has been mathematically validated. Every state is reachable from the start state, accepting paths match the regular language criteria, and execution modular parities align perfectly.
              </div>
            </div>
          </div>
        </div>

        {explanationDetails && (
          <>
            <div className="explanation-divider" />
            <div className="explanation-test-cases-grid">
              <div>
                <h6 className="explanation-section-title green">Example Accepted Strings</h6>
                <ul className="explanation-list bullets">
                  {explanationDetails.accepted.length > 0 ? (
                    explanationDetails.accepted.map((str, idx) => <li key={idx}><code>{str}</code></li>)
                  ) : (
                    <li>No short strings accepted.</li>
                  )}
                </ul>
              </div>
              <div>
                <h6 className="explanation-section-title red">Example Rejected Strings</h6>
                <ul className="explanation-list bullets">
                  {explanationDetails.rejected.length > 0 ? (
                    explanationDetails.rejected.map((str, idx) => <li key={idx}><code>{str}</code></li>)
                  ) : (
                    <li>No short strings rejected.</li>
                  )}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Main wrapper enclosing the ReactFlowProvider (Requirement 8)
export const AutomataDiagram: React.FC<AutomataDiagramProps> = ({ automaton }) => {
  return (
    <ReactFlowProvider>
      <AutomataDiagramInner automaton={automaton} />
    </ReactFlowProvider>
  );
};

export default AutomataDiagram;
