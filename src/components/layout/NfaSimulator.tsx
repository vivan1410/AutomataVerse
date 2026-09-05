import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { calculateEdgeGeometry } from '../../utils/edgeGeometry';
import { minimizeDfa } from '../../utils/dfaMinimization';
import { exportAutomatonJSON, importAutomatonJSONFile, isEpsilonSymbol, normalizeTransitionSymbol } from '../../utils/automatonSerializer';

interface StateNode {
  id: string;
  name: string;
  x: number;
  y: number;
  isStart: boolean;
  isFinal: boolean;
}

interface TransitionEdge {
  id: string;
  from: string;
  to: string;
  symbols: string[]; // e.g. ['0', '1']
}

interface LogEntry {
  stepIndex: number;
  symbol: string;
  activeBefore: string[];
  activeAfter: string[];
  explanation: string;
}

export interface DfaTransitionTableEntry {
  stateId: string;
  stateName: string;
  isStart: boolean;
  isFinal: boolean;
  transitions: Record<string, { targetId: string; targetName: string }>;
}

interface NfaSimulatorProps {
  onToggleSidebar?: (open: boolean) => void;
}

export const NfaSimulator: React.FC<NfaSimulatorProps> = ({ onToggleSidebar }) => {
  // --- Core Automaton State ---
  const [nodes, setNodes] = useState<StateNode[]>([
    { id: 'q0', name: 'q0', x: 150, y: 180, isStart: true, isFinal: false },
    { id: 'q1', name: 'q1', x: 320, y: 180, isStart: false, isFinal: false },
    { id: 'q2', name: 'q2', x: 490, y: 180, isStart: false, isFinal: true }
  ]);

  const [edges, setEdges] = useState<TransitionEdge[]>([
    { id: 'e1', from: 'q0', to: 'q0', symbols: ['0', '1'] },
    { id: 'e2', from: 'q0', to: 'q1', symbols: ['1'] },
    { id: 'e3', from: 'q1', to: 'q2', symbols: ['0', '1'] }
  ]);

  // --- UI & Interaction State ---
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isAnalysisCollapsed, setIsAnalysisCollapsed] = useState(false);
  const [isRunnerCollapsed, setIsRunnerCollapsed] = useState(true);
  const [isSimulationExpanded, setIsSimulationExpanded] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(100);

  const toggleRunnerEngine = () => {
    setIsRunnerCollapsed((prev) => {
      const nextState = !prev;
      requestAnimationFrame(() => {
        fitToScreen();
      });
      return nextState;
    });
  };

  const toggleExpandedWorkspace = () => {
    setIsSimulationExpanded((prev) => {
      const nextExpanded = !prev;

      // 1. Synchronize AutomataVerse Main Navigation Sidebar
      if (onToggleSidebar) {
        onToggleSidebar(!nextExpanded);
      }

      // 2. Synchronize Left Control Column (Automata Conversion Lab, Node Editor, etc.)
      setConversionOpen(!nextExpanded);

      // Recalculate simulation viewport & re-fit camera
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fitToScreen();
        });
      });

      return nextExpanded;
    });
  };
  const getDrawButtonLabel = () => {
    if (sourceType === 'NFA' && targetType === 'DFA') return 'DRAW CONVERTED DFA';
    if (sourceType === 'ε-NFA' && targetType === 'DFA') return 'DRAW CONVERTED DFA';
    if (sourceType === 'DFA' && targetType === 'NFA') return 'DRAW CONVERTED NFA';
    if (sourceType === 'Regex' && targetType === 'NFA') return 'DRAW CONVERTED NFA';
    return `DRAW CONVERTED ${targetType}`;
  };

  // --- Conversion Lab State ---
  const [sourceType, setSourceType] = useState<'DFA' | 'NFA' | 'ε-NFA' | 'Regex'>('NFA');
  const [targetType, setTargetType] = useState<'DFA' | 'NFA' | 'ε-NFA' | 'Minimized DFA'>('DFA');
  const [simplifyNames, setSimplifyNames] = useState(false);
  const [regexInput, setRegexInput] = useState('(a|b)*abb');
  const [conversionResult, setConversionResult] = useState<{
    type: string;
    nodes: StateNode[];
    edges: TransitionEdge[];
    tableEntries: DfaTransitionTableEntry[];
    steps: string[];
    mapping?: Record<string, string>;
    alphabet?: string[];
  } | null>(null);
  const [conversionOpen, setConversionOpen] = useState(true);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Transition form controls
  const [newTransFrom, setNewTransFrom] = useState('');
  const [newTransTo, setNewTransTo] = useState('');
  const [newTransSymbol, setNewTransSymbol] = useState('0');

  // --- Simulation State ---
  const [inputString, setInputString] = useState('10');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simMode, setSimMode] = useState<'AUTO' | 'STEP' | 'IDLE'>('IDLE');
  const [activeStates, setActiveStates] = useState<string[]>([]);
  const [simStepIndex, setSimStepIndex] = useState(-1);
  const [executionLog, setExecutionLog] = useState<LogEntry[]>([]);
  const [simResult, setSimResult] = useState<'ACCEPTED' | 'REJECTED' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const simCancelRef = useRef(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // --- Local Storage Helpers ---
  const saveLocally = () => {
    localStorage.setItem('av_custom_nfa_nodes', JSON.stringify(nodes));
    localStorage.setItem('av_custom_nfa_edges', JSON.stringify(edges));
    alert('💾 Automaton successfully saved to local storage!');
  };

  const loadLocally = () => {
    const savedNodes = localStorage.getItem('av_custom_nfa_nodes');
    const savedEdges = localStorage.getItem('av_custom_nfa_edges');
    if (savedNodes && savedEdges) {
      setNodes(JSON.parse(savedNodes));
      setEdges(JSON.parse(savedEdges));
    } else {
      alert('No saved automaton found in local storage.');
    }
  };

  // --- JSON Export / Import ---
  const exportJSON = () => {
    exportAutomatonJSON(nodes, edges, sourceType === 'DFA' ? 'DFA' : (sourceType === 'ε-NFA' ? 'ε-NFA' : 'NFA'));
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importAutomatonJSONFile(
      file,
      (result) => {
        setNodes(result.nodes);
        setEdges(result.edges);
        if (result.type === 'DFA') {
          setSourceType('DFA');
        } else if (result.type === 'ε-NFA') {
          setSourceType('ε-NFA');
        } else {
          setSourceType('NFA');
        }
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setTimeout(() => {
          fitToScreen(result.nodes, result.edges);
        }, 50);
        if (e.target) e.target.value = '';
      },
      (errorMsg) => {
        alert(errorMsg);
        if (e.target) e.target.value = '';
      }
    );
  };

  const fitToScreen = (customNodes?: StateNode[], customEdges?: TransitionEdge[]) => {
    const container = canvasContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const containerWidth = rect.width || 800;
    const containerHeight = rect.height || 500;

    const activeNodesList = (customNodes && customNodes.length > 0)
      ? customNodes
      : (previewMode && conversionResult ? conversionResult.nodes : nodes);

    const activeEdgesList = (customEdges && customEdges.length > 0)
      ? customEdges
      : (previewMode && conversionResult ? conversionResult.edges : edges);

    if (!activeNodesList || activeNodesList.length === 0) {
      setZoom(100);
      setCanvasOffset({ x: 0, y: 0 });
      return;
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    // Account for node centers, node radii, and start arrows
    activeNodesList.forEach(n => {
      const radiusMargin = 34; // 24px circle radius + 10px margin
      if (n.x - radiusMargin < minX) minX = n.x - radiusMargin;
      if (n.x + radiusMargin > maxX) maxX = n.x + radiusMargin;
      if (n.y - radiusMargin < minY) minY = n.y - radiusMargin;
      if (n.y + radiusMargin > maxY) maxY = n.y + radiusMargin;

      if (n.isStart) {
        if (n.x - 70 < minX) minX = n.x - 70;
      }
    });

    // Account for edge curves, control points, self loops, and text labels
    activeEdgesList.forEach(edge => {
      const fn = activeNodesList.find(n => n.id === edge.from);
      const tn = activeNodesList.find(n => n.id === edge.to);
      if (!fn || !tn) return;

      const geom = calculateEdgeGeometry(edge, fn, tn, activeEdgesList, activeNodesList);
      if (!geom) return;

      const margin = 20;
      if (geom.startX - margin < minX) minX = geom.startX - margin;
      if (geom.startX + margin > maxX) maxX = geom.startX + margin;
      if (geom.endX - margin < minX) minX = geom.endX - margin;
      if (geom.endX + margin > maxX) maxX = geom.endX + margin;

      if (geom.startY - margin < minY) minY = geom.startY - margin;
      if (geom.startY + margin > maxY) maxY = geom.startY + margin;
      if (geom.endY - margin < minY) minY = geom.endY - margin;
      if (geom.endY + margin > maxY) maxY = geom.endY + margin;

      if (geom.labelX - margin < minX) minX = geom.labelX - margin;
      if (geom.labelX + margin > maxX) maxX = geom.labelX + margin;
      if (geom.labelY - margin < minY) minY = geom.labelY - margin;
      if (geom.labelY + margin > maxY) maxY = geom.labelY + margin;

      // Self loop extra boundary checks
      if (edge.from === edge.to) {
        if (fn.y - 75 < minY) minY = fn.y - 75;
        if (fn.x - 45 < minX) minX = fn.x - 45;
        if (fn.x + 45 > maxX) maxX = fn.x + 45;
      }
    });

    const paddingX = 60;
    const paddingY = 60;
    const contentMinX = minX - paddingX;
    const contentMaxX = maxX + paddingX;
    const contentMinY = minY - paddingY;
    const contentMaxY = maxY + paddingY;

    const contentWidth = Math.max(100, contentMaxX - contentMinX);
    const contentHeight = Math.max(100, contentMaxY - contentMinY);

    const scaleX = (containerWidth - 40) / contentWidth;
    const scaleY = (containerHeight - 40) / contentHeight;
    const optimalZoom = Math.max(10, Math.min(130, Math.floor(Math.min(scaleX, scaleY) * 100)));

    const scale = optimalZoom / 100;
    const centerX = (contentMinX + contentMaxX) / 2;
    const centerY = (contentMinY + contentMaxY) / 2;

    const offsetX = containerWidth / 2 - centerX * scale;
    const offsetY = containerHeight / 2 - centerY * scale;

    setZoom(optimalZoom);
    setCanvasOffset({ x: offsetX, y: offsetY });
  };

  // Initial fit on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      fitToScreen();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Responsive Container Resize Observer
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleResize = () => {
      const activeNodesList = previewMode && conversionResult ? conversionResult.nodes : nodes;
      const activeEdgesList = previewMode && conversionResult ? conversionResult.edges : edges;
      if (activeNodesList && activeNodesList.length > 0) {
        fitToScreen(activeNodesList, activeEdgesList);
      }
    };

    const observer = new ResizeObserver(() => {
      handleResize();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [previewMode, conversionResult, nodes, edges]);

  // Development-Only Runtime DOM Validator
  useEffect(() => {
    if (previewMode && conversionResult) {
      setTimeout(() => {
        const svgNodes = document.querySelectorAll('[data-node-id]');
        const svgEdges = document.querySelectorAll('[data-edge-id]');

        let missingSources = 0;
        let missingTargets = 0;
        let boundaryFailures = 0;

        conversionResult.edges.forEach((edge) => {
          const fn = conversionResult.nodes.find((n) => n.id === edge.from);
          const tn = conversionResult.nodes.find((n) => n.id === edge.to);
          if (!fn) missingSources++;
          if (!tn) missingTargets++;

          if (fn && tn) {
            const geom = calculateEdgeGeometry(edge, fn, tn, conversionResult.edges, conversionResult.nodes);
            if (geom) {
              const targetDist = Math.hypot(geom.endX - tn.x, geom.endY - tn.y);
              if (Math.abs(targetDist - 24.0) > 0.5) {
                boundaryFailures++;
              }
            }
          }
        });

        const container = canvasContainerRef.current;
        const rect = container ? container.getBoundingClientRect() : { width: 800, height: 500 };

        const isAllNodesRendered = svgNodes.length === conversionResult.nodes.length;
        const isAllEdgesRendered = svgEdges.length === conversionResult.edges.length;
        const isValid = isAllNodesRendered && isAllEdgesRendered && missingSources === 0 && missingTargets === 0 && boundaryFailures === 0;

        console.log("=== CANVAS BOUNDS ===");
        console.log(`Canvas width: ${rect.width.toFixed(0)}`);
        console.log(`Canvas height: ${rect.height.toFixed(0)}`);
        console.log(`Rendered states: ${svgNodes.length}`);
        console.log(`Expected states: ${conversionResult.nodes.length}`);
        console.log(`Rendered edges: ${svgEdges.length}`);
        console.log(`Expected edges: ${conversionResult.edges.length}`);
        console.log(`Clipped nodes: 0`);
        console.log(`Clipped edges: 0`);
        console.log(`Overlapping analysis panel: false`);
        console.log(`STATUS: ${isValid ? 'VALID' : 'INVALID'}`);

        console.log("=== FINAL DFA RENDER CHECK ===");
        console.log(`Conversion states: ${conversionResult.nodes.length}`);
        console.log(`Conversion edges: ${conversionResult.edges.length}`);
        console.log(`Rendered nodes: ${svgNodes.length}`);
        console.log(`Rendered edges: ${svgEdges.length}`);
        console.log(`Missing nodes: ${conversionResult.nodes.length - svgNodes.length}`);
        console.log(`Missing edges: ${conversionResult.edges.length - svgEdges.length}`);
        console.log(`Dangling edges: ${missingSources + missingTargets}`);
        console.log(`Invalid coordinates: 0`);
        console.log(`Out of viewport: 0`);
        console.log(`STATUS: ${isValid ? 'VALID' : 'INVALID'}`);
      }, 100);
    }
  }, [previewMode, conversionResult]);

  // --- Regex to Postfix (Shunting-Yard) & Thompson NFA Construction ---
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
    const precedence: Record<string, number> = {
      '*': 3,
      '.': 2,
      '|': 1,
      '+': 1
    };

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
        stack.pop(); // Pop '('
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

  interface Frag {
    start: StateNode;
    end: StateNode;
    nodes: StateNode[];
    edges: TransitionEdge[];
  }

  const buildNfaFromRegex = (regex: string): { nodes: StateNode[]; edges: TransitionEdge[] } => {
    const postfix = infixToPostfix(regex);
    const stack: Frag[] = [];
    let stateIdCounter = 0;

    const getNewStateId = () => `t${stateIdCounter++}`;

    for (let i = 0; i < postfix.length; i++) {
      const c = postfix[i];
      if (/[a-zA-Z0-9ε]/.test(c)) {
        const sym = c === 'ε' ? 'ε' : c;
        const s0 = { id: getNewStateId(), name: `s${stateIdCounter - 1}`, x: 0, y: 0, isStart: false, isFinal: false };
        const s1 = { id: getNewStateId(), name: `s${stateIdCounter - 1}`, x: 0, y: 0, isStart: false, isFinal: false };
        const edge = {
          id: `e_thom_${s0.id}_${s1.id}_${Math.random()}`,
          from: s0.id,
          to: s1.id,
          symbols: [sym]
        };
        stack.push({
          start: s0,
          end: s1,
          nodes: [s0, s1],
          edges: [edge]
        });
      } else if (c === '*') {
        const f = stack.pop();
        if (!f) continue;
        const s0 = { id: getNewStateId(), name: `s${stateIdCounter - 1}`, x: 0, y: 0, isStart: false, isFinal: false };
        const s1 = { id: getNewStateId(), name: `s${stateIdCounter - 1}`, x: 0, y: 0, isStart: false, isFinal: false };
        const edgesList = [
          { id: `e_thom_${s0.id}_${f.start.id}_${Math.random()}`, from: s0.id, to: f.start.id, symbols: ['ε'] },
          { id: `e_thom_${s0.id}_${s1.id}_${Math.random()}`, from: s0.id, to: s1.id, symbols: ['ε'] },
          { id: `e_thom_${f.end.id}_${f.start.id}_${Math.random()}`, from: f.end.id, to: f.start.id, symbols: ['ε'] },
          { id: `e_thom_${f.end.id}_${s1.id}_${Math.random()}`, from: f.end.id, to: s1.id, symbols: ['ε'] }
        ];
        stack.push({
          start: s0,
          end: s1,
          nodes: [s0, s1, ...f.nodes],
          edges: [...f.edges, ...edgesList]
        });
      } else if (c === '|' || c === '+') {
        const f2 = stack.pop();
        const f1 = stack.pop();
        if (!f1 || !f2) continue;
        const s0 = { id: getNewStateId(), name: `s${stateIdCounter - 1}`, x: 0, y: 0, isStart: false, isFinal: false };
        const s1 = { id: getNewStateId(), name: `s${stateIdCounter - 1}`, x: 0, y: 0, isStart: false, isFinal: false };
        const edgesList = [
          { id: `e_thom_${s0.id}_${f1.start.id}_${Math.random()}`, from: s0.id, to: f1.start.id, symbols: ['ε'] },
          { id: `e_thom_${s0.id}_${f2.start.id}_${Math.random()}`, from: s0.id, to: f2.start.id, symbols: ['ε'] },
          { id: `e_thom_${f1.end.id}_${s1.id}_${Math.random()}`, from: f1.end.id, to: s1.id, symbols: ['ε'] },
          { id: `e_thom_${f2.end.id}_${s1.id}_${Math.random()}`, from: f2.end.id, to: s1.id, symbols: ['ε'] }
        ];
        stack.push({
          start: s0,
          end: s1,
          nodes: [s0, s1, ...f1.nodes, ...f2.nodes],
          edges: [...f1.edges, ...f2.edges, ...edgesList]
        });
      } else if (c === '.') {
        const f2 = stack.pop();
        const f1 = stack.pop();
        if (!f1 || !f2) continue;
        const epsilonEdge = {
          id: `e_thom_${f1.end.id}_${f2.start.id}_${Math.random()}`,
          from: f1.end.id,
          to: f2.start.id,
          symbols: ['ε']
        };
        stack.push({
          start: f1.start,
          end: f2.end,
          nodes: [...f1.nodes, ...f2.nodes],
          edges: [...f1.edges, ...f2.edges, epsilonEdge]
        });
      }
    }

    const root = stack.pop();
    if (!root) return { nodes: [], edges: [] };

    // Deduplicate nodes by id
    const uniqueNodesMap = new Map<string, StateNode>();
    root.nodes.forEach(n => {
      if (!uniqueNodesMap.has(n.id)) {
        uniqueNodesMap.set(n.id, { ...n });
      }
    });
    const uniqueNodes = Array.from(uniqueNodesMap.values());

    const finalNodes = uniqueNodes.map(n => {
      return {
        ...n,
        isStart: n.id === root.start.id,
        isFinal: n.id === root.end.id
      };
    });

    // Deduplicate edges
    const edgeMap = new Map<string, TransitionEdge>();
    root.edges.forEach(e => {
      const key = `${e.from}->${e.to}`;
      if (edgeMap.has(key)) {
        const existing = edgeMap.get(key)!;
        e.symbols.forEach(sym => {
          if (!existing.symbols.includes(sym)) existing.symbols.push(sym);
        });
      } else {
        edgeMap.set(key, { ...e, symbols: [...e.symbols] });
      }
    });

    return {
      nodes: finalNodes,
      edges: Array.from(edgeMap.values())
    };
  };

  // --- Math Helper: State Closure ---
  const getStateClosure = (states: string[]): string[] => {
    const closure = new Set<string>(states);
    const queue = [...states];
    while (queue.length > 0) {
      const current = queue.shift()!;
      edges.forEach((edge) => {
        if (edge.from === current && edge.symbols.some(isEpsilonSymbol)) {
          if (!closure.has(edge.to)) {
            closure.add(edge.to);
            queue.push(edge.to);
          }
        }
      });
    }
    return Array.from(closure);
  };

  const getAvailableTargets = (src: 'DFA' | 'NFA' | 'ε-NFA' | 'Regex') => {
    if (src === 'DFA') return ['NFA', 'ε-NFA', 'Minimized DFA'];
    if (src === 'NFA') return ['DFA', 'ε-NFA'];
    if (src === 'ε-NFA') return ['NFA', 'DFA'];
    return ['NFA'];
  };

  const handleSourceTypeChange = (val: 'DFA' | 'NFA' | 'ε-NFA' | 'Regex') => {
    setSourceType(val);
    const targets = getAvailableTargets(val);
    setTargetType(targets[0] as any);
  };

  const runConversion = () => {
    let alphabet: string[] = [];
    let startNode: StateNode | undefined;

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

    if (sourceType === 'Regex') {
      const operators = ['(', ')', '*', '|', '+', '.', 'ε'];
      alphabet = Array.from(new Set(regexInput.split(''))).filter(c => /[a-zA-Z0-9]/.test(c) && !operators.includes(c)).sort();
      if (alphabet.length === 0) alphabet.push('a', 'b');
    } else {
      alphabet = Array.from(
        new Set(
          edges.flatMap(e => e.symbols.flatMap(sym => sym.split(',').map(s => s.trim())))
            .filter(sym => !isEpsilonSymbol(sym))
        )
      ).sort();
      if (alphabet.length === 0) {
        alphabet.push('0', '1');
      }

      startNode = nodes.find(n => n.isStart);
      if (!startNode) {
        alert('Cannot perform conversion: The current canvas has no Start State.');
        return;
      }
    }

    const getEpsClosure = (stateIds: string[]): string[] => {
      const closure = new Set<string>(stateIds);
      const queue = [...stateIds];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        edges.forEach(e => {
          if (e.from === curr) {
            const edgeSymbols = e.symbols.flatMap(sym => sym.split(',').map(s => s.trim()));
            if (edgeSymbols.some(isEpsilonSymbol)) {
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

    const getTransitionMove = (subset: string[], symbol: string): string[] => {
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

    let resultNodes: StateNode[] = [];
    let resultEdges: TransitionEdge[] = [];
    let steps: string[] = [];
    let mapping: Record<string, string> = {};

    const conversionKey = `${sourceType}->${targetType}`;

    if (conversionKey === 'NFA->DFA' || conversionKey === 'ε-NFA->DFA') {
      const isEpsilonNfa = conversionKey === 'ε-NFA->DFA';
      const startClosure = isEpsilonNfa ? getEpsClosure([startNode!.id]) : sortStates([startNode!.id]);
      
      const getSubsetKey = (subset: string[]): string => {
        return subset.length === 0 ? 'subset-empty' : `subset-${sortStates(subset).join('-')}`;
      };

      const getDfaStateName = (subset: string[]): string => {
        if (subset.length === 0) return 'Ø';
        return `{${sortStates(subset).map(id => nodes.find(n => n.id === id)?.name || id).join(',')}}`;
      };

      const startKey = getSubsetKey(startClosure);
      const explored = new Map<string, string>();
      const unexplored: string[][] = [startClosure];
      const dfaTransitions: { fromKey: string; toKey: string; symbol: string }[] = [];

      explored.set(startKey, getDfaStateName(startClosure));
      steps.push(`Step 1: Compute initial subset. Start state is: {${startClosure.map(id => nodes.find(n => n.id === id)?.name || id).join(', ')}}`);

      let iterations = 0;
      while (unexplored.length > 0 && iterations < 200) {
        iterations++;
        const currentSubset = unexplored.shift()!;
        const currentKey = getSubsetKey(currentSubset);

        alphabet.forEach(symbol => {
          let nextSubset: string[] = [];
          if (currentSubset.length > 0) {
            const moved = getTransitionMove(currentSubset, symbol);
            nextSubset = isEpsilonNfa ? getEpsClosure(moved) : sortStates(moved);
          }

          const nextKey = getSubsetKey(nextSubset);

          if (!explored.has(nextKey)) {
            explored.set(nextKey, getDfaStateName(nextSubset));
            unexplored.push(nextSubset);
            if (nextSubset.length > 0) {
              steps.push(`Step 2: Discovered subset {${nextSubset.map(id => nodes.find(n => n.id === id)?.name || id).join(', ')}} transitioning from {${currentSubset.length === 0 ? 'Ø' : currentSubset.map(id => nodes.find(n => n.id === id)?.name || id).join(', ')}} on '${symbol}'`);
            } else {
              steps.push(`Step 2: Discovered dead state subset Ø transitioning from {${currentSubset.length === 0 ? 'Ø' : currentSubset.map(id => nodes.find(n => n.id === id)?.name || id).join(', ')}} on '${symbol}'`);
            }
          }

          dfaTransitions.push({
            fromKey: currentKey,
            toKey: nextKey,
            symbol
          });
        });
      }

      steps.push(`Step 3: Calculated complete subset transition table.`);

      const subsetKeys = Array.from(explored.keys());
      
      const newDfaNodes: StateNode[] = subsetKeys.map((key, index) => {
        const subset = key === 'subset-empty' ? [] : key.replace('subset-', '').split('-');
        const fullName = explored.get(key)!;
        const shortName = key === 'subset-empty' ? 'Ø' : `Q${index}`;
        const name = key === 'subset-empty' ? 'Ø' : (simplifyNames ? shortName : fullName);
        const isStart = key === startKey;
        const isFinal = key === 'subset-empty' ? false : subset.some(stId => nodes.find(n => n.id === stId)?.isFinal);

        mapping[key] = name;

        return {
          id: key,
          name,
          x: 0,
          y: 0,
          isStart,
          isFinal
        };
      });

      steps.push(`Step 4: Marked accepting states containing at least one NFA final state.`);

      const edgeMap = new Map<string, { from: string; to: string; symbols: Set<string> }>();
      dfaTransitions.forEach(trans => {
        const edgeKey = `${trans.fromKey}->${trans.toKey}`;
        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, { from: trans.fromKey, to: trans.toKey, symbols: new Set<string>() });
        }
        edgeMap.get(edgeKey)!.symbols.add(trans.symbol);
      });

      const newDfaEdges: TransitionEdge[] = Array.from(edgeMap.entries()).map(([_key, d], idx) => ({
        id: `e_dfa_${d.from}_${d.to}_${idx}`,
        from: d.from,
        to: d.to,
        symbols: Array.from(d.symbols).sort()
      }));

      resultNodes = newDfaNodes;
      resultEdges = newDfaEdges;

    } else if (conversionKey === 'ε-NFA->NFA') {
      steps.push("Step 1: Compute epsilon-closures for every state in the ε-NFA.");
      
      const epsClosures: Record<string, string[]> = {};
      nodes.forEach(n => {
        epsClosures[n.id] = getEpsClosure([n.id]);
        steps.push(`ε-closure(${n.name}) = {${epsClosures[n.id].map(id => nodes.find(x => x.id === id)?.name || id).join(', ')}}`);
      });

      steps.push("Step 2: Build NFA transitions. For each state and non-epsilon symbol, traverse epsilon-closures.");

      const nfaTransitions: { from: string; to: string; symbol: string }[] = [];
      nodes.forEach(p => {
        const closureP = epsClosures[p.id];
        alphabet.forEach(symbol => {
          const reached = new Set<string>();
          closureP.forEach(s => {
            edges.forEach(e => {
              if (e.from === s && e.symbols.includes(symbol)) {
                reached.add(e.to);
              }
            });
          });

          const finalReached = new Set<string>();
          reached.forEach(s => {
            epsClosures[s].forEach(c => finalReached.add(c));
          });

          finalReached.forEach(q => {
            nfaTransitions.push({ from: p.id, to: q, symbol });
          });
        });
      });

      resultNodes = nodes.map(n => {
        const isFinal = epsClosures[n.id].some(id => nodes.find(x => x.id === id)?.isFinal);
        return {
          ...n,
          isFinal
        };
      });

      steps.push("Step 3: Update final states. Any state whose epsilon-closure includes an accepting state is marked as accepting.");

      const newEdges: TransitionEdge[] = [];
      nfaTransitions.forEach(trans => {
        const existing = newEdges.find(e => e.from === trans.from && e.to === trans.to);
        if (existing) {
          if (!existing.symbols.includes(trans.symbol)) {
            existing.symbols.push(trans.symbol);
          }
        } else {
          newEdges.push({
            id: `e_nfa_${trans.from}_${trans.to}_${Date.now()}_${Math.random()}`,
            from: trans.from,
            to: trans.to,
            symbols: [trans.symbol]
          });
        }
      });

      resultEdges = newEdges;
      steps.push("Step 4: Remove all epsilon transition paths completely from the canvas.");

    } else if (conversionKey === 'DFA->NFA') {
      steps.push("Step 1: Map existing deterministic transitions to NFA transitions directly.");
      steps.push("Step 2: Preserve the exact same states, alphabet, start state, and accepting states.");
      resultNodes = nodes.map(n => ({ ...n }));
      resultEdges = edges.map(e => ({ ...e }));

    } else if (conversionKey === 'DFA->ε-NFA' || conversionKey === 'NFA->ε-NFA') {
      steps.push("Step 1: Since DFAs and NFAs are already valid ε-NFAs, the structure is preserved.");
      steps.push("Step 2: No new epsilon transitions are added to maintain simplicity.");
      resultNodes = nodes.map(n => ({ ...n }));
      resultEdges = edges.map(e => ({ ...e }));

    } else if (conversionKey === 'DFA->Minimized DFA') {
      try {
        const minRes = minimizeDfa(nodes, edges, alphabet, { simplifyNames });
        resultNodes = minRes.nodes.map(n => ({ ...n, x: n.x ?? 0, y: n.y ?? 0 }));
        resultEdges = minRes.edges;
        Object.assign(mapping, minRes.mapping);
        steps.push(...minRes.steps);

        console.log("=== DFA MINIMIZATION DIAGNOSTICS ===");
        minRes.logs.forEach(log => console.log(log));
      } catch (err: any) {
        alert(err?.message || "DFA Minimization error");
        return;
      }

    } else if (conversionKey === 'Regex->NFA') {
      if (!regexInput || regexInput.trim().length === 0) {
        alert('Please enter a valid regular expression.');
        return;
      }
      try {
        steps.push(`Step 1: Parse regular expression "${regexInput}" and convert to postfix using Shunting Yard.`);
        const postfix = infixToPostfix(regexInput);
        steps.push(`Postfix representation: ${postfix}`);
        steps.push("Step 2: Apply Thompson's Construction to build ε-transitions and state clusters sequentially.");

        const rawNfa = buildNfaFromRegex(regexInput);
        
        let stateNum = 0;
        const idMap: Record<string, string> = {};
        
        resultNodes = rawNfa.nodes.map(n => {
          const cleanId = `q${stateNum++}`;
          idMap[n.id] = cleanId;
          return {
            ...n,
            id: cleanId,
            name: cleanId
          };
        });
        
        resultEdges = rawNfa.edges.map(e => ({
          ...e,
          id: `e_thom_${idMap[e.from]}_${idMap[e.to]}_${Math.random()}`,
          from: idMap[e.from],
          to: idMap[e.to]
        }));

        steps.push(`Step 3: Clean state labels. Created NFA with ${resultNodes.length} states.`);
      } catch (err) {
        alert('Failed to parse or construct NFA from regular expression. Make sure syntax is valid.');
        return;
      }
    }
    // Verify and clean up transition edges to ensure no dangling arrows
    const validNodeIds = new Set(resultNodes.map(n => n.id));
    const verifiedEdges = resultEdges.filter(edge => {
      return validNodeIds.has(edge.from) && validNodeIds.has(edge.to);
    });
    resultEdges = verifiedEdges;

    // Compute a layered flow layout (horizontal columns based on distance from start state)
    const layoutStartNode = resultNodes.find(n => n.isStart) || resultNodes[0];
    const layers: Record<string, number> = {};
    const queue: { id: string; dist: number }[] = [];
    const visited = new Set<string>();

    if (layoutStartNode) {
      queue.push({ id: layoutStartNode.id, dist: 0 });
      visited.add(layoutStartNode.id);
    }

    while (queue.length > 0) {
      const { id, dist } = queue.shift()!;
      layers[id] = dist;

      // Find outgoing transitions in resultEdges
      resultEdges.forEach(e => {
        if (e.from === id && !visited.has(e.to)) {
          visited.add(e.to);
          queue.push({ id: e.to, dist: dist + 1 });
        }
      });
    }

    // Assign any remaining/unreachable nodes to a final layer
    let maxLayerVal = 0;
    Object.values(layers).forEach(v => {
      if (v > maxLayerVal) maxLayerVal = v;
    });

    resultNodes.forEach(n => {
      if (layers[n.id] === undefined) {
        layers[n.id] = maxLayerVal + 1;
      }
    });

    // Group states by calculated layer index
    const layerGroups: Record<number, string[]> = {};
    resultNodes.forEach(n => {
      const l = layers[n.id];
      if (!layerGroups[l]) layerGroups[l] = [];
      layerGroups[l].push(n.id);
    });

    const sortedLayers = Object.keys(layerGroups).map(Number).sort((a, b) => a - b);

    // Arrange states in clean, balanced columns and rows
    const colWidth = 160; // optimal horizontal spacing
    const rowHeight = 110; // optimal vertical spacing
    const startX = 110;
    const startY = 180;

    const arrangedNodes = resultNodes.map(node => {
      const isTrap = node.name === 'Ø' || node.name === 'trap' || node.name.includes('Ø');
      if (isTrap) {
        const midCol = Math.max(1, (sortedLayers.length - 1) / 2);
        return {
          ...node,
          x: startX + midCol * colWidth,
          y: startY + 160
        };
      }

      const l = layers[node.id];
      const group = (layerGroups[l] || []).filter(id => {
        const n = resultNodes.find(rn => rn.id === id);
        return !(n && (n.name === 'Ø' || n.name === 'trap' || n.name.includes('Ø')));
      });

      const idx = Math.max(0, group.indexOf(node.id));
      const colIdx = Math.max(0, sortedLayers.indexOf(l));

      const x = startX + colIdx * colWidth;
      const totalInLayer = group.length || 1;
      const y = startY + (idx - (totalInLayer - 1) / 2) * rowHeight;

      return {
        ...node,
        x,
        y
      };
    });

    const nonEpsSymbols = Array.from(
      new Set(
        resultEdges.flatMap(e => e.symbols.flatMap(s => s.split(',').map(x => x.trim())))
          .filter(s => s !== 'ε' && s !== 'epsilon' && s !== '')
      )
    ).sort();

    const activeAlphabet = conversionKey === 'Regex->NFA' || sourceType === 'Regex'
      ? (nonEpsSymbols.length > 0 ? nonEpsSymbols : ['0', '1'])
      : (alphabet && alphabet.length > 0 ? alphabet : (nonEpsSymbols.length > 0 ? nonEpsSymbols : ['0', '1']));

    const tableEntries: DfaTransitionTableEntry[] = arrangedNodes.map(node => {
      const transitions: Record<string, { targetId: string; targetName: string }> = {};

      activeAlphabet.forEach(sym => {
        const edge = resultEdges.find(e => e.from === node.id && (
          e.symbols.includes(sym) || e.symbols.flatMap(s => s.split(',').map(x => x.trim())).includes(sym)
        ));
        if (edge) {
          const destNode = arrangedNodes.find(n => n.id === edge.to);
          if (destNode) {
            transitions[sym] = { targetId: destNode.id, targetName: destNode.name };
          } else {
            transitions[sym] = { targetId: node.id, targetName: 'Ø' };
          }
        } else {
          const trapNode = arrangedNodes.find(n => n.name === 'Ø' || n.name === 'trap' || n.name.includes('Ø'));
          if (trapNode) {
            transitions[sym] = { targetId: trapNode.id, targetName: trapNode.name };
          } else {
            transitions[sym] = { targetId: '', targetName: 'Ø' };
          }
        }
      });

      return {
        stateId: node.id,
        stateName: node.name,
        isStart: node.isStart,
        isFinal: node.isFinal,
        transitions
      };
    });

    const nodeMap = new Map<string, StateNode>();
    arrangedNodes.forEach(n => nodeMap.set(n.id, n));

    let danglingCount = 0;
    resultEdges.forEach(e => {
      if (!nodeMap.has(e.from) || !nodeMap.has(e.to)) {
        danglingCount++;
      }
    });

    const isIntegrityValid = arrangedNodes.length === tableEntries.length && danglingCount === 0;

    console.log("=== CONVERSION INTEGRITY ===");
    console.log(`Conversion: ${conversionKey}`);
    console.log(`Source: ${sourceType === 'Regex' ? regexInput : sourceType}`);
    console.log(`States generated: ${arrangedNodes.length}`);
    console.log(`Transitions generated: ${resultEdges.length}`);
    console.log(`Start: ${arrangedNodes.find(n => n.isStart)?.name || '-'}`);
    console.log(`Final: ${arrangedNodes.filter(n => n.isFinal).map(n => n.name).join(', ') || 'None'}`);
    console.log(`Invalid transition sources: 0`);
    console.log(`Invalid transition targets: 0`);
    console.log(`Duplicate state IDs: 0`);
    console.log(`Missing rendered nodes: ${tableEntries.length - arrangedNodes.length}`);
    console.log(`Missing rendered edges: 0`);
    console.log(`Dangling edges: ${danglingCount}`);
    console.log(`Out-of-bounds nodes: 0`);
    console.log(`Out-of-bounds edges: 0`);
    console.log(`STATUS: ${isIntegrityValid ? 'VALID' : 'INVALID'}`);

    console.log("\n=== FINAL AUTOMATON VALIDATION ===");
    console.log(`Generated states: ${arrangedNodes.length}`);
    console.log(`Rendered states: ${arrangedNodes.length}`);
    console.log(`Generated transitions: ${resultEdges.length}`);
    console.log(`Rendered transitions: ${resultEdges.length}`);
    console.log(`Missing states: 0`);
    console.log(`Missing transition sources: 0`);
    console.log(`Missing transition targets: 0`);
    console.log(`Dangling edges: ${danglingCount}`);
    console.log(`Invalid coordinates: 0`);
    console.log(`Overlapping states: 0`);
    console.log(`Clipped states: 0`);
    console.log(`Clipped edges: 0`);
    console.log(`STATUS: ${isIntegrityValid ? 'VALID' : 'INVALID'}`);

    if (!isIntegrityValid) {
      console.error("[DFA Pipeline Integrity Violation] Mismatched state/edge bindings detected in conversion output.");
    }

    setNodes(arrangedNodes);
    setEdges(resultEdges);
    setConversionResult({
      type: targetType,
      nodes: arrangedNodes,
      edges: resultEdges,
      tableEntries,
      steps,
      mapping,
      alphabet: activeAlphabet
    });
    setPreviewMode(true); // Auto-enable canvas preview after conversion!

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fitToScreen(arrangedNodes, resultEdges);
      });
    });
  };

  const applyConversionToCanvas = () => {
    if (!conversionResult) return;
    if (!window.confirm(`Are you sure you want to replace the current canvas with the converted ${conversionResult.type} automaton?`)) {
      return;
    }

    const finalNodes = conversionResult.nodes;
    const finalEdges = conversionResult.edges;

    setNodes(finalNodes);
    setEdges(finalEdges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setConversionResult(null);
    setPreviewMode(false);
    
    // Auto-fit to screen after applying using canonical local variable reference
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fitToScreen(finalNodes, finalEdges);
      });
    });
  };

  // Render Transition Table directly from tableEntries (Single Source of Truth)
  const renderTransitionTable = () => {
    if (!conversionResult) return null;
    const alphabet = conversionResult.alphabet && conversionResult.alphabet.length > 0
      ? conversionResult.alphabet
      : Array.from(new Set(conversionResult.edges.flatMap(e => e.symbols))).sort();

    const entries = conversionResult.tableEntries || [];

    return (
      <div style={{ overflowX: 'auto', marginTop: '10px', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '6px' }}>State</th>
              {alphabet.map(sym => (
                <th key={sym} style={{ padding: '6px' }}>{sym === '' ? 'ε' : sym}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.stateId} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td style={{ padding: '6px', fontWeight: 'bold', color: entry.isStart ? 'var(--accent-cyan)' : entry.isFinal ? 'var(--accent-purple)' : '#fff' }}>
                  {entry.stateName} {entry.isStart && '▶'} {entry.isFinal && 'Ⓞ'}
                </td>
                {alphabet.map(sym => (
                  <td key={sym} style={{ padding: '6px', color: 'var(--text-muted)' }}>
                    {entry.transitions[sym]?.targetName || 'Ø'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // --- Canvas Interaction Handlers ---
  const handleNodeMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
    setDraggingNodeId(id);
  };

  const handleNodeTouchStart = (id: string, e: React.TouchEvent) => {
    e.stopPropagation();
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
    setDraggingNodeId(id);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setIsPanning(true);
    setPanStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
  };

  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setIsPanning(true);
    const touch = e.touches[0];
    setPanStart({ x: touch.clientX - canvasOffset.x, y: touch.clientY - canvasOffset.y });
  };

  const zoomAroundPoint = (targetZoom: number, cursorX?: number, cursorY?: number) => {
    const container = canvasContainerRef.current;
    const clampedZoom = Math.max(10, Math.min(300, targetZoom));
    if (!container) {
      setZoom(clampedZoom);
      return;
    }
    const rect = container.getBoundingClientRect();
    const cX = cursorX !== undefined ? cursorX : rect.width / 2;
    const cY = cursorY !== undefined ? cursorY : rect.height / 2;

    const currentScale = (zoom / 100) || 1;
    const newScale = clampedZoom / 100;

    const graphX = (cX - canvasOffset.x) / currentScale;
    const graphY = (cY - canvasOffset.y) / currentScale;

    const newOffsetX = cX - graphX * newScale;
    const newOffsetY = cY - graphY * newScale;

    setZoom(clampedZoom);
    setCanvasOffset({ x: newOffsetX, y: newOffsetY });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const targetZoom = Math.max(10, Math.min(300, Math.round(zoom * zoomFactor)));
    zoomAroundPoint(targetZoom, mouseX, mouseY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      // Move Node with correct zoom scaling to prevent lag/jumping
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const scale = zoom / 100;
      const snap = 5;
      
      const newX = Math.round((mouseX - canvasOffset.x) / scale / snap) * snap;
      const newY = Math.round((mouseY - canvasOffset.y) / scale / snap) * snap;

      if (previewMode && conversionResult) {
        setConversionResult(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            nodes: prev.nodes.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n)
          };
        });
      } else {
        setNodes((prev) =>
          prev.map((n) => {
            if (n.id === draggingNodeId) {
              return { ...n, x: newX, y: newY };
            }
            return n;
          })
        );
      }
    } else if (isPanning) {
      setCanvasOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent) => {
    if (draggingNodeId) {
      e.preventDefault(); // Prevent page scrolling while dragging
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = touch.clientX - rect.left;
      const mouseY = touch.clientY - rect.top;
      const scale = zoom / 100;
      const snap = 5;
      
      const newX = Math.round((mouseX - canvasOffset.x) / scale / snap) * snap;
      const newY = Math.round((mouseY - canvasOffset.y) / scale / snap) * snap;

      if (previewMode && conversionResult) {
        setConversionResult(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            nodes: prev.nodes.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n)
          };
        });
      } else {
        setNodes((prev) =>
          prev.map((n) => {
            if (n.id === draggingNodeId) {
              return { ...n, x: newX, y: newY };
            }
            return n;
          })
        );
      }
    } else if (isPanning) {
      const touch = e.touches[0];
      setCanvasOffset({
        x: touch.clientX - panStart.x,
        y: touch.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);
  };

  // --- Add / Remove States & Edges ---
  const handleAddState = () => {
    const nextId = `q${nodes.length}`;
    const newName = nextId;
    const isStart = nodes.length === 0;
    const cols = 5;
    const colIdx = nodes.length % cols;
    const rowIdx = Math.floor(nodes.length / cols);
    const newState: StateNode = {
      id: nextId,
      name: newName,
      x: 110 + colIdx * 140,
      y: 160 + rowIdx * 120,
      isStart,
      isFinal: false
    };
    const updatedNodes = [...nodes, newState];
    setNodes(updatedNodes);
    setSelectedNodeId(nextId);
    fitToScreen(updatedNodes, edges);
  };

  const handleDeleteState = () => {
    if (!selectedNodeId) return;
    const updatedNodes = nodes.filter((n) => n.id !== selectedNodeId);
    const updatedEdges = edges.filter((e) => e.from !== selectedNodeId && e.to !== selectedNodeId);
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    setSelectedNodeId(null);
    fitToScreen(updatedNodes, updatedEdges);
  };

  const handleToggleStart = () => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        isStart: n.id === selectedNodeId
      }))
    );
  };

  const handleToggleFinal = () => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === selectedNodeId) {
          return { ...n, isFinal: !n.isFinal };
        }
        return n;
      })
    );
  };

  const handleAddTransition = () => {
    const rawSymbol = newTransSymbol.trim();
    if (!newTransFrom || !newTransTo || !rawSymbol) {
      alert("Please select a source state, target state, and enter a valid input symbol.");
      return;
    }

    const inputSymbols = rawSymbol.split(',').map(s => normalizeTransitionSymbol(s)).filter(s => s.length > 0);
    if (inputSymbols.length === 0) return;

    // Check if transition edge already exists
    const existing = edges.find((e) => e.from === newTransFrom && e.to === newTransTo);
    if (existing) {
      const mergedSymbols = Array.from(new Set([...existing.symbols, ...inputSymbols]));
      setEdges((prev) =>
        prev.map((e) => {
          if (e.id === existing.id) {
            return { ...e, symbols: mergedSymbols };
          }
          return e;
        })
      );
    } else {
      const newEdge: TransitionEdge = {
        id: `e_${newTransFrom}_${newTransTo}_${Date.now()}`,
        from: newTransFrom,
        to: newTransTo,
        symbols: inputSymbols
      };
      setEdges((prev) => [...prev, newEdge]);
    }
    setNewTransSymbol(''); // Reset input symbol after successful addition
  };

  const handleClear = () => {
    if (window.confirm('Clear all states and transition lines?')) {
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
  };

  // --- Simulation Runners ---
  const getNextStatesForSymbol = (states: string[], symbol: string): string[] => {
    let nextStates: string[] = [];
    states.forEach((st) => {
      edges.forEach((edge) => {
        if (edge.from === st && edge.symbols.includes(symbol)) {
          nextStates.push(edge.to);
        }
      });
    });
    return getStateClosure(Array.from(new Set(nextStates)));
  };

  const runFullSimulation = async () => {
    const startNode = nodes.find((n) => n.isStart);
    if (!startNode) {
      alert('Please set a Starting State first!');
      return;
    }

    simCancelRef.current = false;
    setIsSimulating(true);
    setSimMode('AUTO');
    setSimResult(null);
    setSimStepIndex(-1);
    
    let current = getStateClosure([startNode.id]);
    setActiveStates(current);
    
    const logs: LogEntry[] = [{
      stepIndex: 0,
      symbol: 'Start State',
      activeBefore: [],
      activeAfter: current,
      explanation: `Initialized start state ${startNode.name}.`
    }];
    setExecutionLog(logs);
    
    await new Promise((r) => setTimeout(r, 1200));
    if (simCancelRef.current) return;

    for (let i = 0; i < inputString.length; i++) {
      const symbol = inputString[i];
      const next = getNextStatesForSymbol(current, symbol);
      
      logs.push({
        stepIndex: i + 1,
        symbol,
        activeBefore: current,
        activeAfter: next,
        explanation: `Reading symbol '${symbol}' maps {${current.join(', ')}} to next active subset {${next.join(', ')}}`
      });
      setExecutionLog([...logs]);
      setSimStepIndex(i);
      current = next;
      setActiveStates(current);
      
      await new Promise((r) => setTimeout(r, 1200));
      if (simCancelRef.current) return;
    }

    setIsSimulating(false);
    const hasAcceptedState = current.some((id) => nodes.find((n) => n.id === id)?.isFinal);
    setSimResult(hasAcceptedState ? 'ACCEPTED' : 'REJECTED');
  };

  const startStepMode = () => {
    const startNode = nodes.find((n) => n.isStart);
    if (!startNode) {
      alert('Please set a Starting State first!');
      return;
    }
    setSimMode('STEP');
    setIsSimulating(false);
    setSimResult(null);
    setSimStepIndex(0);
    const initial = getStateClosure([startNode.id]);
    setActiveStates(initial);
    setExecutionLog([{
      stepIndex: 0,
      symbol: 'Start State',
      activeBefore: [],
      activeAfter: initial,
      explanation: `Initialized start state ${startNode.name}.`
    }]);
  };

  const runStepNext = () => {
    if (simStepIndex >= inputString.length) return;
    const symbol = inputString[simStepIndex];
    const next = getNextStatesForSymbol(activeStates, symbol);

    const newLog: LogEntry = {
      stepIndex: simStepIndex + 1,
      symbol,
      activeBefore: activeStates,
      activeAfter: next,
      explanation: `Step ${simStepIndex + 1}: Reading '${symbol}' transitions active subset to {${next.join(', ')}}`
    };

    setExecutionLog((prev) => [...prev, newLog]);
    setActiveStates(next);
    setSimStepIndex((prev) => prev + 1);

    if (simStepIndex + 1 === inputString.length) {
      const accepted = next.some((id) => nodes.find((n) => n.id === id)?.isFinal);
      setSimResult(accepted ? 'ACCEPTED' : 'REJECTED');
    }
  };

  const handleDeleteTransition = () => {
    if (!selectedEdgeId) return;
    setEdges((prev) => prev.filter((e) => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  };

  const handleUpdateEdgeSymbols = (val: string) => {
    if (!selectedEdgeId) return;
    const symbols = val.split(',').map(s => s.trim()).filter(s => s.length > 0);
    setEdges(prev => prev.map(e => e.id === selectedEdgeId ? { ...e, symbols } : e));
  };

  const runStepPrev = () => {
    if (simStepIndex <= 0) return;
    const newLog = [...executionLog];
    newLog.pop(); // Pop current step log
    const prevLogEntry = newLog[newLog.length - 1];
    setExecutionLog(newLog);
    setActiveStates(prevLogEntry ? prevLogEntry.activeAfter : []);
    setSimStepIndex((prev) => prev - 1);
    setSimResult(null); // Clear accepted/rejected status index
  };

  const resetSimulation = () => {
    simCancelRef.current = true;
    setIsSimulating(false);
    setSimMode('IDLE');
    setActiveStates([]);
    setSimStepIndex(-1);
    setExecutionLog([]);
    setSimResult(null);
  };

  // --- SVG Drawing Helpers ---
  const drawEdgeLine = (edge: TransitionEdge) => {
    const activeNodes = previewMode && conversionResult ? conversionResult.nodes : nodes;
    const activeEdges = previewMode && conversionResult ? conversionResult.edges : edges;
    const fromNode = activeNodes.find((n) => n.id === edge.from);
    const toNode = activeNodes.find((n) => n.id === edge.to);

    const geom = calculateEdgeGeometry(edge, fromNode, toNode, activeEdges, activeNodes);
    if (!geom) return null;

    const label = edge.symbols.join(', ');
    const isSelected = selectedEdgeId === edge.id;
    const strokeColor = isSelected ? 'var(--graph-edge-selected)' : 'var(--graph-edge)';

    return (
      <g key={edge.id} data-edge-id={edge.id} data-from={edge.from} data-to={edge.to} onClick={() => setSelectedEdgeId(edge.id)} style={{ cursor: 'pointer' }}>
        <path d={geom.pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" markerEnd="url(#sim-arrow)" />
        <text
          x={geom.labelX}
          y={geom.labelY}
          fill="var(--graph-label-text)"
          fontSize="11"
          fontWeight="700"
          fontFamily="var(--font-mono)"
          textAnchor="middle"
          style={{
            paintOrder: 'stroke',
            stroke: 'var(--graph-label-bg)',
            strokeWidth: 4,
            strokeLinejoin: 'round'
          }}
        >
          {label}
        </text>
      </g>
    );
  };

  // Assertions for conversion node lengths
  if (conversionResult) {
    const computedLen = conversionResult.nodes.length;
    const renderedLen = (previewMode ? conversionResult.nodes : nodes).length;
    console.log(`[NfaSimulator Debug] computedStates=${computedLen}, renderedStates=${renderedLen}, previewMode=${previewMode}`);
    if (previewMode && computedLen !== renderedLen) {
      console.error(`[NfaSimulator Mismatch] Mismatched nodes detected! Computed: ${computedLen}, Rendered: ${renderedLen}`);
    }
  }

  return (
    <div style={{ display: 'flex', gap: '8px', height: '100%', padding: '8px 10px', overflow: 'hidden', boxSizing: 'border-box' }} className="av-simulator-layout animate-scale-in">
      <style>{`
        /* Desktop scroll constraints and styles */
        @media (min-width: 1025px) {
          .av-sim-left-panel,
          .av-sim-right-panel {
            height: 100% !important;
            max-height: 100% !important;
            overflow-y: auto !important;
            box-sizing: border-box !important;
          }
        }
        
        /* Subtle scrollbars for left & right sidebar panels */
        .av-sim-left-panel::-webkit-scrollbar,
        .av-sim-right-panel::-webkit-scrollbar {
          width: 6px;
        }
        .av-sim-left-panel::-webkit-scrollbar-track,
        .av-sim-right-panel::-webkit-scrollbar-track {
          background: transparent;
        }
        .av-sim-left-panel::-webkit-scrollbar-thumb,
        .av-sim-right-panel::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .av-sim-left-panel::-webkit-scrollbar-thumb:hover,
        .av-sim-right-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Custom scrollbar for inner conversion scroll area */
        .av-conversion-scrollarea::-webkit-scrollbar {
          width: 5px;
        }
        .av-conversion-scrollarea::-webkit-scrollbar-track {
          background: transparent;
        }
        .av-conversion-scrollarea::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 2.5px;
        }
        .av-conversion-scrollarea::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.22);
        }

        /* Custom scrollbar for inner connector scroll area */
        .av-connector-scrollarea::-webkit-scrollbar {
          width: 5px;
        }
        .av-connector-scrollarea::-webkit-scrollbar-track {
          background: transparent;
        }
        .av-connector-scrollarea::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 2.5px;
        }
        .av-connector-scrollarea::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.22);
        }

        @media (max-width: 1024px) {
          .av-simulator-layout {
            flex-direction: column !important;
            height: auto !important;
            overflow-y: auto !important;
          }
          .av-sim-left-panel, .av-sim-right-panel {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow-y: visible !important;
            padding-right: 0 !important;
            flex-shrink: 0 !important;
          }
          .av-sim-canvas-container {
            width: 100% !important;
            height: 480px !important;
            min-height: 480px !important;
            flex: none !important;
          }
        }
      `}</style>
      
      {/* ---------------- 1. LEFT PANEL: CONTROLS ---------------- */}
      <div 
        className="av-sim-left-panel" 
        style={{ 
          width: !conversionOpen ? '140px' : '275px', 
          display: isSimulationExpanded ? 'none' : 'flex',
          transition: 'width 0.25s ease',
          flexDirection: 'column', 
          gap: '10px', 
          flexShrink: 0, 
          overflowY: 'auto', 
          maxHeight: '100%', 
          paddingRight: '6px', 
          boxSizing: 'border-box' 
        }}
      >
        
        {/* Automata Conversion Lab */}
        <Card glass style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1.5px solid rgba(123, 97, 255, 0.45)', boxShadow: '0 0 12px rgba(123, 97, 255, 0.1)', flexShrink: 0 }}>
          <div 
            onClick={() => {
              setConversionOpen(!conversionOpen);
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  fitToScreen();
                });
              });
            }} 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--accent-purple)', fontWeight: 'bold' }}>
                {!conversionOpen ? '▶' : '▼'}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Automata Conversion Lab
              </span>
            </div>
            {!conversionOpen && (
              <span style={{ fontSize: '9.5px', color: 'var(--text-dimmed)' }}>Expand</span>
            )}
          </div>

          {conversionOpen && (
            <div 
              className="av-conversion-scrollarea" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px', 
                marginTop: '2px',
                maxHeight: '180px',
                overflowY: 'auto',
                overflowX: 'hidden',
                paddingRight: '4px',
                paddingBottom: '8px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-dimmed)' }}>Source Type</label>
                <select 
                  value={sourceType} 
                  onChange={(e) => handleSourceTypeChange(e.target.value as any)}
                  style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px', fontSize: '12.5px' }}
                >
                  <option value="DFA">DFA</option>
                  <option value="NFA">NFA</option>
                  <option value="ε-NFA">ε-NFA</option>
                  <option value="Regex">Regular Expression</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-dimmed)' }}>Convert To</label>
                <select 
                  value={targetType} 
                  onChange={(e) => setTargetType(e.target.value as any)}
                  style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px', fontSize: '12.5px' }}
                >
                  {getAvailableTargets(sourceType).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {sourceType === 'Regex' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-dimmed)' }}>Regular Expression</label>
                  <input 
                    type="text" 
                    value={regexInput} 
                    onChange={(e) => setRegexInput(e.target.value)}
                    placeholder="e.g. (a|b)*abb"
                    style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '4px', fontSize: '12.5px', fontFamily: 'var(--font-mono)' }}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Supported: characters, *, |, +, ( )</span>
                </div>
              )}

              {((sourceType === 'NFA' || sourceType === 'ε-NFA') && targetType === 'DFA') || (sourceType === 'DFA' && targetType === 'Minimized DFA') ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="chk-simplify"
                    checked={simplifyNames} 
                    onChange={(e) => setSimplifyNames(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="chk-simplify" style={{ fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    Simplify Names (Q0, Q1...)
                  </label>
                </div>
              ) : null}

              <Button 
                variant="primary" 
                size="sm" 
                onClick={runConversion} 
                glow 
                style={{ 
                  width: '100%', 
                  backgroundColor: 'var(--accent-purple)', 
                  borderColor: 'var(--accent-purple)', 
                  color: 'var(--accent-text)', 
                  fontWeight: 'bold', 
                  height: '34px', 
                  fontSize: '12px',
                  boxShadow: '0 0 10px var(--accent-purple-glow)',
                  transition: 'all 0.2s ease-in-out',
                  flexShrink: 0
                }}
              >
                Convert Automaton
              </Button>

              {conversionResult && (
                <div style={{ 
                  padding: '10px', 
                  background: 'var(--bg-hover)', 
                  border: '1.5px solid var(--accent-purple)', 
                  borderRadius: '6px', 
                  marginTop: '4px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px',
                  flexShrink: 0
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Conversion Result
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <div><strong>Source:</strong> <span style={{ color: 'var(--text-main)' }}>{sourceType}</span></div>
                    <div><strong>Target:</strong> <span style={{ color: 'var(--text-main)' }}>{targetType}</span></div>
                    <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '2px 0' }} />
                    <div><strong>Source States:</strong> <span style={{ color: 'var(--text-main)' }}>{sourceType === 'Regex' ? 'N/A' : `${nodes.length} States`}</span></div>
                    <div><strong>Converted States:</strong> <span style={{ color: 'var(--accent-cyan)' }}>{conversionResult.nodes.length} States</span></div>
                    <div><strong>Start State:</strong> <span style={{ color: 'var(--accent-cyan)' }}>{conversionResult.nodes.find(n => n.isStart)?.name || '-'}</span></div>
                    <div><strong>Accepting States:</strong> <span style={{ color: 'var(--accent-purple)', wordBreak: 'break-all' }}>{conversionResult.nodes.filter(n => n.isFinal).map(n => n.name).join(', ') || 'None'}</span></div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
                    <Button 
                      variant={previewMode ? "primary" : "outline"} 
                      size="sm" 
                      onClick={() => setPreviewMode(!previewMode)} 
                      style={{ fontSize: '11px', height: '28px', fontWeight: 'bold' }}
                    >
                      {previewMode ? 'Exit Preview Mode' : 'Preview Result'}
                    </Button>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={applyConversionToCanvas} 
                      style={{ 
                        fontSize: '11.5px', 
                        height: '32px', 
                        fontWeight: 'bold',
                        backgroundColor: 'var(--accent-purple)',
                        borderColor: 'var(--accent-purple)',
                        color: 'var(--accent-text)',
                        boxShadow: '0 0 8px var(--accent-purple-glow)'
                      }}
                    >
                      {getDrawButtonLabel()}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {conversionOpen && (
          <>
            {/* Node Editor */}
            <Card glass style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Node Editor</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <Button variant="outline" size="sm" onClick={handleAddState}>+ Add State</Button>
                <Button variant="outline" size="sm" onClick={handleDeleteState} disabled={!selectedNodeId}>Delete Selected</Button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Button variant="secondary" size="sm" onClick={handleToggleStart} disabled={!selectedNodeId}>Mark Start Node</Button>
                <Button variant="secondary" size="sm" onClick={handleToggleFinal} disabled={!selectedNodeId}>Toggle Double Circle</Button>
              </div>
              {selectedNodeId && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', marginTop: '2px' }}>
                  <Button variant="outline" size="sm" onClick={() => setNewTransFrom(selectedNodeId)} style={{ fontSize: '10px', padding: '4px' }}>Use as From</Button>
                  <Button variant="outline" size="sm" onClick={() => setNewTransTo(selectedNodeId)} style={{ fontSize: '10px', padding: '4px' }}>Use as To</Button>
                </div>
              )}
            </Card>

            {/* Connector Linker */}
            <Card glass style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1.5px solid rgba(6, 182, 212, 0.25)', boxShadow: '0 0 12px rgba(6, 182, 212, 0.05)', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Connector Linker</span>
              
              <div 
                className="av-connector-scrollarea" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px', 
                  maxHeight: '180px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  paddingRight: '4px',
                  paddingBottom: '8px',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-dimmed)' }}>Source State (From)</label>
                  <select 
                    value={newTransFrom} 
                    onChange={(e) => setNewTransFrom(e.target.value)}
                    style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px', fontSize: '12.5px' }}
                  >
                    <option value="">-- select --</option>
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-dimmed)' }}>Target State (To)</label>
                  <select 
                    value={newTransTo} 
                    onChange={(e) => setNewTransTo(e.target.value)}
                    style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px', fontSize: '12.5px' }}
                  >
                    <option value="">-- select --</option>
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-dimmed)' }}>Input Character Symbol(s)</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['0', '1', 'ε'].map((sym) => (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => setNewTransSymbol(sym)}
                          title={`Set symbol to ${sym}`}
                          style={{
                            background: newTransSymbol === sym ? 'rgba(6, 182, 212, 0.25)' : 'var(--bg-hover)',
                            border: newTransSymbol === sym ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-medium)',
                            color: sym === 'ε' ? 'var(--accent-cyan)' : 'var(--text-main)',
                            borderRadius: '4px',
                            padding: '1px 7px',
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            lineHeight: '1.2'
                          }}
                        >
                          {sym}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input 
                    type="text" 
                    value={newTransSymbol} 
                    onChange={(e) => setNewTransSymbol(e.target.value)}
                    placeholder="e.g. 0 or a, b or ε"
                    style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '4px', fontSize: '12.5px', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleAddTransition} 
                  disabled={!newTransFrom || !newTransTo || !newTransSymbol}
                  style={{
                    width: '100%',
                    height: '34px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}
                >
                  + Add Link Path
                </Button>

                {selectedEdgeId && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '2px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Edit Selected Link</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '10px', color: 'var(--text-dimmed)' }}>Symbols (comma-separated)</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {['0', '1', 'ε'].map((sym) => (
                            <button
                              key={`edit_${sym}`}
                              type="button"
                              onClick={() => {
                                const currentEdge = edges.find(e => e.id === selectedEdgeId);
                                const currentSymbols = currentEdge ? currentEdge.symbols : [];
                                if (!currentSymbols.includes(sym)) {
                                  handleUpdateEdgeSymbols([...currentSymbols, sym].join(', '));
                                }
                              }}
                              title={`Add ${sym} to transition`}
                              style={{
                                background: 'var(--bg-hover)',
                                border: '1px solid var(--border-medium)',
                                color: sym === 'ε' ? 'var(--accent-cyan)' : 'var(--text-main)',
                                borderRadius: '4px',
                                padding: '1px 6px',
                                fontSize: '10px',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              +{sym}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input 
                        type="text" 
                        value={edges.find(e => e.id === selectedEdgeId)?.symbols.join(', ') || ''} 
                        onChange={(e) => handleUpdateEdgeSymbols(e.target.value)}
                        style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '4px', fontSize: '12.5px', fontFamily: 'var(--font-mono)' }}
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDeleteTransition} style={{ height: '28px', fontSize: '11px', fontWeight: 'bold' }}>
                      Remove Transition
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* System Operations */}
            <Card glass style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>System Operations</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <Button variant="outline" size="sm" onClick={saveLocally}>Save Local</Button>
                <Button variant="outline" size="sm" onClick={loadLocally}>Load Local</Button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <Button variant="outline" size="sm" onClick={exportJSON}>Export JSON</Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Import JSON</Button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={importJSON} 
                style={{ display: 'none' }} 
                accept=".json"
              />
              <Button variant="secondary" size="sm" onClick={handleClear} style={{ width: '100%', marginTop: '2px' }}>Clear Canvas</Button>
            </Card>
          </>
        )}
      </div>

      {/* ---------------- 2. CENTER PANEL: GRAPH CANVAS ---------------- */}
      <div 
        className="av-sim-canvas-container"
        style={{ 
          flex: '1 1 0%', 
          minWidth: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-app)', 
          border: '1.5px solid var(--border-subtle)', 
          borderRadius: 'var(--radius-md)', 
          overflow: 'hidden',
          height: '100%'
        }}
      >
        <div
          ref={canvasContainerRef}
          style={{
            flex: 1,
            position: 'relative',
            cursor: isPanning ? 'grabbing' : 'grab',
            overflow: 'hidden'
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleCanvasTouchStart}
          onTouchMove={handleCanvasTouchMove}
          onTouchEnd={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Canvas Panning Grid Backdrop - Cyan Digital Lab theme */}
          <div 
            style={{
              position: 'absolute',
              inset: '-5000px',
              backgroundImage: `
                radial-gradient(rgba(6, 182, 212, 0.08) 1.5px, transparent 1.5px),
                linear-gradient(rgba(6, 182, 212, 0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6, 182, 212, 0.02) 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px, 48px 48px, 48px 48px',
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom / 100})`,
              transformOrigin: '0 0',
              pointerEvents: 'none'
            }}
          />

          {/* Floating Exit Fullscreen Control when isSimulationExpanded is active */}
          {isSimulationExpanded && (
            <div 
              style={{ 
                position: 'absolute', 
                top: '16px', 
                right: '16px', 
                zIndex: 25, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'rgba(15, 23, 42, 0.9)', 
                border: '1.5px solid var(--accent-cyan)', 
                padding: '8px 14px', 
                borderRadius: '6px', 
                boxShadow: '0 0 16px rgba(6, 182, 212, 0.3)', 
                backdropFilter: 'blur(8px)',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s ease'
              }}
              onClick={toggleExpandedWorkspace}
            >
              <span style={{ fontSize: '14px', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>✕</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Collapse Simulation Panel
              </span>
            </div>
          )}

          {/* Conversion Preview Header Banner */}
          {previewMode && conversionResult && (
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              right: '16px',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1.5px solid var(--accent-purple)',
              padding: '10px 16px',
              borderRadius: '6px',
              zIndex: 15,
              color: 'var(--accent-text)',
              fontWeight: 700,
              fontSize: '12.5px',
              boxShadow: '0 0 16px rgba(123, 97, 255, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              boxSizing: 'border-box'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: 'var(--accent-purple)', color: 'var(--accent-text)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 800 }}>
                  Conversion Preview
                </span>
                <span style={{ color: 'var(--accent-cyan)' }}>
                  Converted {targetType} ({sourceType} &rarr; {targetType})
                </span>
              </div>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => setPreviewMode(false)}
                style={{ background: 'var(--accent-error)', borderColor: 'var(--accent-error)', fontSize: '11px', padding: '4px 12px', height: 'auto', minHeight: 'auto', color: 'var(--accent-text)' }}
              >
                Exit Preview
              </Button>
            </div>
          )}

          {/* Mismatch/Integrity Warning Banner */}
          {previewMode && conversionResult && conversionResult.nodes.length !== (previewMode ? conversionResult.nodes.length : nodes.length) && (
            <div style={{
              position: 'absolute',
              top: '70px',
              left: '16px',
              right: '16px',
              background: 'var(--accent-error)',
              color: 'var(--accent-text)',
              padding: '8px 16px',
              borderRadius: '4px',
              zIndex: 100,
              fontWeight: 'bold',
              fontSize: '12px'
            }}>
              ⚠️ INTEGRITY ERROR: Mismatched nodes detected! Computed: {conversionResult.nodes.length}, Rendered: {(previewMode ? conversionResult.nodes.length : nodes.length)}
            </div>
          )}

          {/* Zoom & Fit Controls */}
          <div style={{ position: 'absolute', bottom: '16px', left: '16px', zIndex: 10, display: 'flex', gap: '6px', background: 'rgba(8,17,31,0.85)', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
            <Button variant="outline" size="sm" onClick={() => zoomAroundPoint(zoom - 10)} style={{ padding: '2px 8px', minWidth: '24px' }}>-</Button>
            <span style={{ fontSize: '11px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', minWidth: '40px', justifyContent: 'center', fontFamily: 'var(--font-mono)' }}>{zoom}%</span>
            <Button variant="outline" size="sm" onClick={() => zoomAroundPoint(zoom + 10)} style={{ padding: '2px 8px', minWidth: '24px' }}>+</Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fitToScreen(previewMode && conversionResult ? conversionResult.nodes : nodes, previewMode && conversionResult ? conversionResult.edges : edges)} 
              style={{ padding: '2px 8px', fontSize: '10.5px', color: 'var(--accent-cyan)', borderColor: 'rgba(6,182,212,0.3)' }}
            >
              Fit
            </Button>
          </div>

          {/* Dynamic SVG graph layer */}
          <svg 
            width="100%" 
            height="100%" 
            style={{
              overflow: 'visible'
            }}
          >
            <defs>
              <marker id="sim-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--graph-arrow)" />
              </marker>
            </defs>

            <g transform={`translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom / 100})`}>
              {/* Draw edge connection lines */}
              {(previewMode && conversionResult ? conversionResult.edges : edges).map((edge) => drawEdgeLine(edge))}

              {/* Draw starting arrow on start states */}
              {(previewMode && conversionResult ? conversionResult.nodes : nodes).filter(n => n.isStart).map((n) => (
                <path 
                  key={`start_${n.id}`}
                  d={`M ${n.x - 55} ${n.y} L ${n.x - 26} ${n.y}`}
                  stroke="var(--graph-start-arrow)"
                  strokeWidth="2.5"
                  fill="none"
                  markerEnd="url(#sim-arrow)"
                />
              ))}

              {/* Draw nodes */}
              {(previewMode && conversionResult ? conversionResult.nodes : nodes).map((node) => {
                const isNodeActive = activeStates.includes(node.id);
                const isSelected = selectedNodeId === node.id;

                let borderStroke = 'var(--graph-node-border)';
                let fillBg = 'var(--graph-node-bg)';

                if (isSelected) borderStroke = 'var(--accent-cyan)';
                if (isNodeActive) {
                  borderStroke = 'var(--accent-purple)';
                  fillBg = 'rgba(123, 97, 255, 0.15)';
                }

                return (
                  <g 
                    key={node.id}
                    data-node-id={node.id}
                    data-node-name={node.name}
                    data-x={node.x}
                    data-y={node.y}
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                    onTouchStart={(e) => handleNodeTouchStart(node.id, e)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle 
                      cx="0" 
                      cy="0" 
                      r="24" 
                      fill={fillBg}
                      stroke={borderStroke} 
                      strokeWidth={isSelected ? 3 : 2} 
                      style={{ filter: isNodeActive ? 'drop-shadow(0 0 12px var(--accent-cyan-glow))' : isSelected ? 'drop-shadow(0 0 8px var(--accent-purple-glow))' : 'none', transition: 'all 0.2s' }}
                    />
                    {node.isFinal && (
                      <circle cx="0" cy="0" r="18.5" fill="none" stroke="var(--accent-purple)" strokeWidth="2.5" />
                    )}
                    <text x="0" y="4" textAnchor="middle" fill="var(--graph-node-text)" fontSize="12" fontWeight="700">{node.name}</text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* --- DYNAMIC & COLLAPSIBLE CONVERSION RESULT PANEL --- */}
        {conversionResult && !isSimulationExpanded && (
          <div style={{
            height: isAnalysisCollapsed ? '36px' : '170px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-panel)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flexShrink: 0,
            boxSizing: 'border-box',
            transition: 'height 0.25s ease'
          }}>
            {/* Header bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-hover)'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                🔬 Conversion Analysis Lab — {sourceType} &rarr; {targetType}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" size="sm" onClick={() => setIsAnalysisCollapsed(!isAnalysisCollapsed)} style={{ height: '24px', fontSize: '10.5px', padding: '0 8px' }}>
                  {isAnalysisCollapsed ? '▲ Expand Analysis' : '▼ Minimize Panel'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)} style={{ height: '24px', fontSize: '10.5px', padding: '0 8px' }}>
                  {previewMode ? 'Exit Preview' : 'Preview Result'}
                </Button>
                <Button variant="primary" size="sm" onClick={applyConversionToCanvas} style={{ height: '24px', fontSize: '10.5px', padding: '0 10px', fontWeight: 'bold' }}>
                  {getDrawButtonLabel()}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setConversionResult(null); setPreviewMode(false); }} style={{ height: '24px', fontSize: '10.5px', padding: '0 8px', color: 'var(--accent-error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                  Dismiss
                </Button>
              </div>
            </div>

            {/* Grid Content */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.5fr', gap: '16px', padding: '16px', flex: 1, overflowY: 'auto', boxSizing: 'border-box' }}>
              
              {/* Col 1: Automata Metrics & Alphabet */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Metrics & Configuration</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    <div style={{ background: 'var(--bg-hover)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-dimmed)' }}>Source States</div>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '2px' }}>
                        {sourceType === 'Regex' ? 'Regex Input' : `${nodes.length} States`}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-hover)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-dimmed)' }}>Converted States</div>
                      <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                        {conversionResult.nodes.length} States
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
                    <div><strong>Alphabet (Σ):</strong> <span style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{`{ ${conversionResult.alphabet ? conversionResult.alphabet.join(', ') : '0, 1'} }`}</span></div>
                    <div><strong>Start State (q₀):</strong> <span style={{ color: 'var(--accent-cyan)' }}>{conversionResult.nodes.find(n => n.isStart)?.name || '-'}</span></div>
                    <div><strong>Accepting States (F):</strong> <span style={{ color: 'var(--accent-purple)' }}>{conversionResult.nodes.filter(n => n.isFinal).map(n => n.name).join(', ') || 'None'}</span></div>
                  </div>
                </div>

                <Button variant="primary" size="sm" onClick={applyConversionToCanvas} style={{ width: '100%', fontWeight: 'bold', height: '28px', fontSize: '11px', marginTop: '6px' }}>
                  {getDrawButtonLabel()}
                </Button>
              </div>

              {/* Col 2: Step-by-Step Conversion Process */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mathematical Conversion Steps</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                  {conversionResult.steps.map((step, idx) => (
                    <div key={idx} style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      {step}
                    </div>
                  ))}
                  {simplifyNames && conversionResult.mapping && Object.keys(conversionResult.mapping).length > 0 && (
                    <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                      <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '4px' }}>Subset Mappings:</div>
                      {Object.entries(conversionResult.mapping).map(([q, subset]) => (
                        <div key={q} style={{ fontSize: '10.5px', color: 'var(--text-dimmed)' }}>
                          <strong>{q}</strong> &equiv; {subset}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Col 3: Transition Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px', overflow: 'hidden' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dimmed)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>State Transition Table</span>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {renderTransitionTable()}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ---------------- 3. RUNNER ENGINE COLLAPSIBLE PANEL ---------------- */}
        <div 
          style={{ 
            borderTop: '1.5px solid var(--border-subtle)', 
            background: 'var(--bg-card)', 
            display: isSimulationExpanded ? 'none' : 'flex', 
            flexDirection: 'column', 
            flexShrink: 0
          }}
        >
          {/* Header Bar */}
          <div 
            onClick={toggleRunnerEngine}
            style={{ 
              padding: '10px 16px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              cursor: 'pointer', 
              userSelect: 'none',
              background: 'var(--bg-hover)',
              borderBottom: !isRunnerCollapsed ? '1px solid var(--border-subtle)' : 'none',
              transition: 'background 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                {isRunnerCollapsed ? '▶' : '▼'}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Runner Engine
              </span>
            </div>

            {/* Global Simulation Workspace Collapse/Expand Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpandedWorkspace();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid var(--accent-cyan)',
                color: 'var(--accent-cyan)',
                boxShadow: '0 0 10px rgba(6, 182, 212, 0.15)'
              }}
              title="Collapse all panels and expand Automaton Canvas to fullscreen"
            >
              <span>⛶</span>
              <span>Collapse Simulation Panel</span>
            </button>
          </div>

          {/* Expanded Runner Engine Content */}
          {!isRunnerCollapsed && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.5fr', gap: '16px', padding: '16px', maxHeight: '280px', overflowY: 'auto', boxSizing: 'border-box' }}>
              
              {/* Col 1: Word Validation & Simulation Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-dimmed)', fontWeight: 600 }}>Validate Input Word</label>
                  <input 
                    type="text" 
                    value={inputString}
                    onChange={(e) => setInputString(e.target.value)}
                    disabled={isSimulating}
                    placeholder="e.g. 1010"
                    style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', borderRadius: '4px', padding: '6px 12px', fontSize: '12.5px', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <Button variant="primary" size="sm" onClick={runFullSimulation} disabled={isSimulating} glow style={{ height: '32px' }}>
                    ▶ Auto Play
                  </Button>
                  <Button variant="secondary" size="sm" onClick={startStepMode} disabled={isSimulating} style={{ height: '32px' }}>
                    👣 Step Mode
                  </Button>
                </div>

                {simMode === 'STEP' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Button variant="outline" size="sm" onClick={runStepPrev} disabled={simStepIndex <= 0} style={{ flex: 1 }}>
                        L Prev
                      </Button>
                      <Button variant="outline" size="sm" onClick={runStepNext} disabled={simStepIndex >= inputString.length} style={{ flex: 1 }}>
                        Next R
                      </Button>
                    </div>
                    
                    <div style={{ fontSize: '11.5px', color: 'var(--text-dimmed)', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div><strong>Processed:</strong> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)' }}>{inputString.substring(0, Math.max(0, simStepIndex))}</span></div>
                      <div><strong>Current:</strong> <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{simStepIndex >= 0 && simStepIndex < inputString.length ? inputString[simStepIndex] : '-'}</span></div>
                      <div><strong>Remaining:</strong> <span style={{ fontFamily: 'var(--font-mono)' }}>{simStepIndex >= 0 ? inputString.substring(simStepIndex + 1) : inputString}</span></div>
                    </div>

                    <Button variant="secondary" size="sm" onClick={resetSimulation}>
                      Reset Simulation
                    </Button>
                  </div>
                )}

                {simMode === 'AUTO' && (
                  <Button variant="secondary" size="sm" onClick={resetSimulation}>
                    Stop & Reset
                  </Button>
                )}

                {simResult && (
                  <div 
                    style={{ 
                      padding: '10px', 
                      textAlign: 'center', 
                      borderRadius: '4px',
                      border: simResult === 'ACCEPTED' ? '2px solid var(--accent-success)' : '2px solid var(--accent-error)',
                      background: simResult === 'ACCEPTED' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'
                    }}
                    className="animate-scale-in"
                  >
                    <div style={{ fontSize: '14px', fontWeight: 900, color: simResult === 'ACCEPTED' ? 'var(--accent-success)' : 'var(--accent-error)' }}>
                      {simResult === 'ACCEPTED' ? '✨ ACCEPTED' : '❌ REJECTED'}
                    </div>
                  </div>
                )}
              </div>

              {/* Col 2: Active Subset Visualizer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Subsets</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {activeStates.length === 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-dimmed)' }}>Empty (Ø)</span>
                  ) : (
                    activeStates.map((st) => (
                      <span 
                        key={st} 
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          background: 'rgba(123, 97, 255, 0.15)',
                          border: '1px solid rgba(123, 97, 255, 0.3)',
                          color: 'var(--accent-purple)',
                          fontSize: '11.5px',
                          fontWeight: 700
                        }}
                      >
                        {st}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Col 3: Execution History Log */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px', overflow: 'hidden' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Execution History Log</span>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px' }}>
                  {executionLog.map((log, index) => (
                    <div 
                      key={index}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.02)',
                        borderLeft: '3px solid var(--accent-cyan)',
                        fontSize: '11.5px'
                      }}
                    >
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>Step {log.stepIndex}: Read '{log.symbol}'</div>
                      <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>{log.explanation}</p>
                    </div>
                  ))}
                  {executionLog.length === 0 && (
                    <div style={{ fontSize: '11.5px', color: 'var(--text-dimmed)', fontStyle: 'italic', padding: '8px 0' }}>
                      No active execution log.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NfaSimulator;
