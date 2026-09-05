import React, { useState, useEffect, useRef } from 'react';
import './DfaAcademy.css';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { calculateEdgeGeometry } from '../../utils/edgeGeometry';
import { exportAutomatonJSON, importAutomatonJSONFile, normalizeTransitionSymbol } from '../../utils/automatonSerializer';

// SVG Icons
const ZoomInIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>;
const ZoomOutIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="11" x2="8" y2="11"/><line x1="14" y1="11" x2="8" y2="11"/></svg>;

interface NfaStateNode {
  id: string;
  name: string;
  x: number;
  y: number;
  isStart: boolean;
  isFinal: boolean;
}

interface NfaTransitionEdge {
  id: string;
  from: string;
  to: string;
  symbols: string[];
}

interface ConversionStep {
  dfaStateLabel: string;
  nfaStates: string[];
  symbol: string;
  targetNfaStates: string[];
  targetDfaStateLabel: string;
  isNewState: boolean;
  explanation: string;
  stateMappings: Record<string, string[]>;
  dfaTransitions: Array<{ from: string; to: string; symbol: string }>;
  dfaStatesList: Array<{ id: string; name: string; isStart: boolean; isFinal: boolean; x: number; y: number }>;
}

export const NfaConverter: React.FC = () => {
  // --- NFA Graph States ---
  const [nodes, setNodes] = useState<NfaStateNode[]>([
    { id: 'q0', name: 'q0', x: 80, y: 120, isStart: true, isFinal: false },
    { id: 'q1', name: 'q1', x: 200, y: 80, isStart: false, isFinal: false },
    { id: 'q2', name: 'q2', x: 200, y: 160, isStart: false, isFinal: true }
  ]);

  const [edges, setEdges] = useState<NfaTransitionEdge[]>([
    { id: 'e1', from: 'q0', to: 'q0', symbols: ['0'] },
    { id: 'e2', from: 'q0', to: 'q1', symbols: ['0', '1'] },
    { id: 'e3', from: 'q1', to: 'q2', symbols: ['1'] },
    { id: 'e4', from: 'q2', to: 'q0', symbols: ['1'] }
  ]);

  // Selected elements for editing
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Manual input fields
  const [newTransFrom, setNewTransFrom] = useState('');
  const [newTransTo, setNewTransTo] = useState('');
  const [newTransSymbol, setNewTransSymbol] = useState('0');

  // Canvas Pan & Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Conversion States ---
  const [steps, setSteps] = useState<ConversionStep[]>([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showExplanations, setShowExplanations] = useState(true);
  const [compareMode, setCompareMode] = useState(true);



  // Closure helper
  const getStateClosure = (startStates: string[]): string[] => {
    const parseNumber = (s: string) => {
      const match = s.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };
    return Array.from(new Set(startStates)).sort((a, b) => {
      const numA = parseNumber(a);
      const numB = parseNumber(b);
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  };

  // Run subset construction
  const computeSubsetConstruction = () => {
    const startNode = nodes.find((n) => n.isStart);
    if (!startNode) {
      alert('Please set an NFA start state first!');
      return;
    }

    const nfaFinals = nodes.filter((n) => n.isFinal).map((n) => n.id);
    const computedSteps: ConversionStep[] = [];

    // Dynamic alphabet computation
    const alphabet = Array.from(
      new Set(
        edges.flatMap(e => e.symbols.flatMap(sym => sym.split(',').map(s => s.trim())))
          .filter(sym => sym !== '' && sym !== 'ε' && sym !== 'epsilon')
      )
    ).sort();
    if (alphabet.length === 0) {
      alphabet.push('0', '1');
    }

    const initialSubset = getStateClosure([startNode.id]);
    const labelMap: Record<string, string> = {
      [initialSubset.join(',')]: 'A'
    };
    const reverseMap: Record<string, string[]> = {
      'A': initialSubset
    };

    const queue: string[][] = [initialSubset];
    const dfaTransitions: Array<{ from: string; to: string; symbol: string }> = [];
    let nextLabelCode = 66; // 'B'





    const layoutDfaNodes = (
      statesList: Array<{ id: string; name: string; isStart: boolean; isFinal: boolean }>,
      transitionsList: Array<{ from: string; to: string; symbol: string }>
    ) => {
      const layoutStartNode = statesList.find(n => n.isStart) || statesList[0];
      const layers: Record<string, number> = {};
      const q: { id: string; dist: number }[] = [];
      const visited = new Set<string>();

      if (layoutStartNode) {
        q.push({ id: layoutStartNode.id, dist: 0 });
        visited.add(layoutStartNode.id);
      }

      while (q.length > 0) {
        const { id, dist } = q.shift()!;
        layers[id] = dist;

        transitionsList.forEach(e => {
          if (e.from === id && !visited.has(e.to)) {
            visited.add(e.to);
            q.push({ id: e.to, dist: dist + 1 });
          }
        });
      }

      let maxLayerVal = 0;
      Object.values(layers).forEach(v => {
        if (v > maxLayerVal) maxLayerVal = v;
      });

      statesList.forEach(n => {
        if (layers[n.id] === undefined) {
          layers[n.id] = maxLayerVal + 1;
        }
      });

      const layerGroups: Record<number, string[]> = {};
      statesList.forEach(n => {
        const l = layers[n.id];
        if (!layerGroups[l]) layerGroups[l] = [];
        layerGroups[l].push(n.id);
      });

      const sortedLayers = Object.keys(layerGroups).map(Number).sort((a, b) => a - b);

      const colWidth = 100;
      const rowHeight = 65;
      const startX = 50;
      const startY = 120;

      return statesList.map(node => {
        const l = layers[node.id];
        const group = layerGroups[l];
        const idx = group.indexOf(node.id);
        const colIdx = sortedLayers.indexOf(l);

        const x = startX + colIdx * colWidth;
        const totalInLayer = group.length;
        const y = startY + (idx - (totalInLayer - 1) / 2) * rowHeight;

        return {
          ...node,
          x,
          y
        };
      });
    };

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLabel = labelMap[current.join(',')];

      // If evaluating from empty dead subset Ø
      if (current.length === 0) {
        alphabet.forEach((symbol) => {
          dfaTransitions.push({ from: 'Ø', to: 'Ø', symbol });
          
          const dfaStatesList = Object.entries(labelMap).map(([k, label]) => ({
            id: label,
            name: label,
            isStart: label === 'A',
            isFinal: k !== '' && k.split(',').some((id) => nfaFinals.includes(id))
          }));

          const positionedStatesList = layoutDfaNodes(dfaStatesList, dfaTransitions);

          computedSteps.push({
            dfaStateLabel: 'Ø',
            nfaStates: [],
            symbol,
            targetNfaStates: [],
            targetDfaStateLabel: 'Ø',
            isNewState: false,
            explanation: `Evaluating empty dead state Ø on symbol '${symbol}'. It transitions back to Ø.`,
            stateMappings: { ...reverseMap },
            dfaTransitions: [...dfaTransitions],
            dfaStatesList: positionedStatesList
          });
        });
        continue;
      }

      alphabet.forEach((symbol) => {
        // Collect targets
        const reached = new Set<string>();
        current.forEach((st) => {
          edges.forEach((edge) => {
            if (edge.from === st && edge.symbols.includes(symbol)) {
              reached.add(edge.to);
            }
          });
        });

        const targetClosure = getStateClosure(Array.from(reached));
        const key = targetClosure.join(',');
        let isNew = false;
        let targetLabel = labelMap[key];

        if (!targetLabel) {
          if (targetClosure.length === 0) {
            targetLabel = 'Ø';
          } else {
            targetLabel = String.fromCharCode(nextLabelCode++);
          }
          labelMap[key] = targetLabel;
          reverseMap[targetLabel] = targetClosure;
          queue.push(targetClosure);
          isNew = true;
        }

        dfaTransitions.push({ from: currentLabel, to: targetLabel, symbol });

        // Build states list
        const dfaStatesList = Object.entries(labelMap).map(([k, label]) => ({
          id: label,
          name: label,
          isStart: label === 'A',
          isFinal: k !== '' && k.split(',').some((id) => nfaFinals.includes(id))
        }));

        const positionedStatesList = layoutDfaNodes(dfaStatesList, dfaTransitions);

        computedSteps.push({
          dfaStateLabel: currentLabel,
          nfaStates: [...current],
          symbol,
          targetNfaStates: [...targetClosure],
          targetDfaStateLabel: targetLabel,
          isNewState: isNew,
          explanation: currentLabel === 'Ø' 
            ? `Evaluating dead state Ø on symbol '${symbol}'. Reachable states are {${targetClosure.join(', ')}}, mapping to Ø.`
            : `Evaluating DFA state ${currentLabel} {${current.map(id => nodes.find(n => n.id === id)?.name || id).join(', ')}} on input symbol '${symbol}'. Reachable states in NFA are {${targetClosure.map(id => nodes.find(n => n.id === id)?.name || id).join(', ')}}, which maps to DFA state ${targetLabel}.`,
          stateMappings: { ...reverseMap },
          dfaTransitions: [...dfaTransitions],
          dfaStatesList: positionedStatesList
        });
      });
    }

    setSteps(computedSteps);
    setStepIdx(0);
  };


  // Auto-play conversion ticker
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setStepIdx((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          setIsPlaying(false);
          return prev;
        }
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlaying, steps]);

  // Load predefined sample configurations
  const loadSampleNfa = (num: number) => {
    if (num === 1) {
      setNodes([
        { id: 'q0', name: 'q0', x: 80, y: 120, isStart: true, isFinal: false },
        { id: 'q1', name: 'q1', x: 200, y: 80, isStart: false, isFinal: false },
        { id: 'q2', name: 'q2', x: 200, y: 160, isStart: false, isFinal: true }
      ]);
      setEdges([
        { id: 'e1', from: 'q0', to: 'q0', symbols: ['0'] },
        { id: 'e2', from: 'q0', to: 'q1', symbols: ['0', '1'] },
        { id: 'e3', from: 'q1', to: 'q2', symbols: ['1'] },
        { id: 'e4', from: 'q2', to: 'q0', symbols: ['1'] }
      ]);
    } else {
      setNodes([
        { id: 'q0', name: 'q0', x: 80, y: 120, isStart: true, isFinal: false },
        { id: 'q1', name: 'q1', x: 240, y: 120, isStart: false, isFinal: true }
      ]);
      setEdges([
        { id: 'e1', from: 'q0', to: 'q0', symbols: ['0'] },
        { id: 'e2', from: 'q0', to: 'q1', symbols: ['1'] },
        { id: 'e3', from: 'q1', to: 'q1', symbols: ['0', '1'] }
      ]);
    }
    resetConversion();
  };

  // Node editing handlers
  const handleAddState = () => {
    const id = `q${nodes.length}`;
    const newNode: NfaStateNode = {
      id,
      name: id,
      x: 100 + Math.random() * 100,
      y: 100 + Math.random() * 100,
      isStart: false,
      isFinal: false
    };
    setNodes((prev) => [...prev, newNode]);
    resetConversion();
  };

  const handleDeleteState = () => {
    if (!selectedNodeId) return;
    setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
    setEdges((prev) => prev.filter((e) => e.from !== selectedNodeId && e.to !== selectedNodeId));
    setSelectedNodeId(null);
    resetConversion();
  };

  const handleToggleStart = () => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        isStart: n.id === selectedNodeId
      }))
    );
    resetConversion();
  };

  const handleToggleFinal = () => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNodeId ? { ...n, isFinal: !n.isFinal } : n))
    );
    resetConversion();
  };

  const handleAddTransition = () => {
    if (!newTransFrom || !newTransTo) return;
    const cleanSym = normalizeTransitionSymbol(newTransSymbol);
    const existing = edges.find((e) => e.from === newTransFrom && e.to === newTransTo);
    if (existing) {
      if (!existing.symbols.includes(cleanSym)) {
        setEdges((prev) =>
          prev.map((e) =>
            e.id === existing.id ? { ...e, symbols: [...e.symbols, cleanSym] } : e
          )
        );
      }
    } else {
      const newEdge: NfaTransitionEdge = {
        id: `e_${newTransFrom}_${newTransTo}_${Date.now()}`,
        from: newTransFrom,
        to: newTransTo,
        symbols: [cleanSym]
      };
      setEdges((prev) => [...prev, newEdge]);
    }
    resetConversion();
  };

  const handleDeleteTransition = () => {
    if (!selectedEdgeId) return;
    setEdges((prev) => prev.filter((e) => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
    resetConversion();
  };

  const handleUpdateEdgeSymbols = (val: string) => {
    if (!selectedEdgeId) return;
    const symbols = val.split(',').map((s) => normalizeTransitionSymbol(s)).filter((s) => s.length > 0);
    setEdges((prev) => prev.map((e) => (e.id === selectedEdgeId ? { ...e, symbols } : e)));
    resetConversion();
  };

  const resetConversion = () => {
    setSteps([]);
    setStepIdx(-1);
    setIsPlaying(false);
  };

  const handleClear = () => {
    if (window.confirm('Clear canvas to start drawing a blank NFA?')) {
      setNodes([]);
      setEdges([]);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      resetConversion();
    }
  };

  // Local Storage integration
  const saveLocally = () => {
    const payload = { nodes, edges };
    localStorage.setItem('av_nfa_converter_data', JSON.stringify(payload));
    alert('NFA graph configuration saved locally!');
  };

  const loadLocally = () => {
    const saved = localStorage.getItem('av_nfa_converter_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      setNodes(parsed.nodes || []);
      setEdges(parsed.edges || []);
      resetConversion();
    } else {
      alert('No saved NFA configurations found.');
    }
  };

  const exportJSON = () => {
    exportAutomatonJSON(nodes, edges, 'NFA');
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importAutomatonJSONFile(
      file,
      (result) => {
        setNodes(result.nodes);
        setEdges(result.edges);
        resetConversion();
        if (e.target) e.target.value = '';
      },
      (errorMsg) => {
        alert(errorMsg);
        if (e.target) e.target.value = '';
      }
    );
  };

  // Canvas Drag & Drop and Pan Helpers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggedNodeId) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggedNodeId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left - pan.x) / zoom);
      const y = Math.round((e.clientY - rect.top - pan.y) / zoom);
      setNodes((prev) =>
        prev.map((n) => (n.id === draggedNodeId ? { ...n, x: Math.max(20, x), y: Math.max(20, y) } : n))
      );
    } else if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
    setIsPanning(false);
  };

  // SVG Curved Vector Drawing Helpers
  const drawEdgeLine = (edge: NfaTransitionEdge) => {
    const fromNode = nodes.find((n) => n.id === edge.from);
    const toNode = nodes.find((n) => n.id === edge.to);

    const geom = calculateEdgeGeometry(edge, fromNode, toNode, edges, nodes);
    if (!geom) return null;

    const label = edge.symbols.join(', ');
    const isSelected = selectedEdgeId === edge.id;
    const strokeColor = isSelected ? 'var(--graph-edge-selected)' : 'var(--graph-edge)';

    return (
      <g key={edge.id} onClick={() => setSelectedEdgeId(edge.id)} style={{ cursor: 'pointer' }}>
        <path d={geom.pathD} fill="none" stroke={strokeColor} strokeWidth="2" markerEnd="url(#arrow)" />
        <text
          x={geom.labelX}
          y={geom.labelY}
          fill="var(--graph-label-text)"
          fontSize="11.5px"
          fontWeight="700"
          textAnchor="middle"
          style={{
            userSelect: 'none',
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

  // DFA Diagram renderer up to current steps
  const drawDfaGraph = () => {
    if (stepIdx < 0 || steps.length === 0) return null;
    const currentStep = steps[stepIdx];
    const { dfaStatesList, dfaTransitions } = currentStep;

    const convertedEdges = dfaTransitions.map((e, idx) => ({
      id: `dfa_edge_${idx}`,
      from: e.from,
      to: e.to,
      symbols: [e.symbol]
    }));

    return (
      <svg width="100%" height="240" style={{ background: 'var(--graph-bg)', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
        <defs>
          <marker id="dfa-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--graph-arrow)" />
          </marker>
        </defs>

        {/* Draw DFA transition edges */}
        {convertedEdges.map((edge) => {
          const fromNode = dfaStatesList.find(n => n.id === edge.from);
          const toNode = dfaStatesList.find(n => n.id === edge.to);

          const geom = calculateEdgeGeometry(edge, fromNode, toNode, convertedEdges, dfaStatesList);
          if (!geom) return null;

          return (
            <g key={edge.id}>
              <path d={geom.pathD} fill="none" stroke="var(--graph-edge)" strokeWidth="1.5" markerEnd="url(#dfa-arrow)" />
              <text
                x={geom.labelX}
                y={geom.labelY}
                fill="var(--graph-label-text)"
                fontSize="10px"
                fontWeight="700"
                textAnchor="middle"
                style={{
                  paintOrder: 'stroke',
                  stroke: 'var(--graph-label-bg)',
                  strokeWidth: 4,
                  strokeLinejoin: 'round'
                }}
              >
                {edge.symbols[0]}
              </text>
            </g>
          );
        })}

        {/* Draw DFA state nodes */}
        {dfaStatesList.map((node) => {
          const coords = { x: node.x, y: node.y };
          const isActive = currentStep.targetDfaStateLabel === node.id;

          return (
            <g key={node.id} transform={`translate(${coords.x}, ${coords.y})`} className="animate-scale-in">
              <circle r="20" fill={isActive ? 'rgba(61,235,255,0.1)' : 'var(--graph-node-bg)'} stroke={isActive ? 'var(--accent-cyan)' : 'var(--graph-node-border)'} strokeWidth={isActive ? '2.5' : '1.5'} style={{ filter: isActive ? 'drop-shadow(0 0 6px var(--accent-cyan))' : 'none' }} />
              {node.isFinal && (
                <circle r="16" fill="none" stroke={isActive ? 'var(--accent-cyan)' : 'var(--graph-node-border)'} strokeWidth="1" />
              )}
              <text y="4" textAnchor="middle" fill="var(--graph-node-text)" fontSize="11" fontWeight="700">
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      
      {/* Upper Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)' }}>Subset Construction Sandbox</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Visualize conversions from Non-Deterministic finite states to Equivalent DFAs.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={() => setCompareMode(!compareMode)}>
            {compareMode ? '🖥️ View Converter Only' : '👥 Compare NFA & DFA'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowExplanations(!showExplanations)}>
            {showExplanations ? 'Hide Explanations' : 'Show Explanations'}
          </Button>
        </div>
      </div>

      {/* Main Workspace Panels Layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* ================= LEFT PANEL ================= */}
        <div style={{ width: '310px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0, borderRight: '1px solid var(--border-subtle)', padding: '16px', overflowY: 'auto' }}>
          
          {/* Predefined samples */}
          <Card glass style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Predefined Examples</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Button variant="outline" size="sm" onClick={() => loadSampleNfa(1)}>NFA Branching</Button>
              <Button variant="outline" size="sm" onClick={() => loadSampleNfa(2)}>Subset "01"</Button>
            </div>
          </Card>

          {/* Node edits */}
          <Card glass style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>State Editor</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Button variant="outline" size="sm" onClick={handleAddState}>+ Add State</Button>
              <Button variant="outline" size="sm" onClick={handleDeleteState} disabled={!selectedNodeId}>Delete selected</Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <Button variant="secondary" size="sm" onClick={handleToggleStart} disabled={!selectedNodeId}>Mark Start node</Button>
              <Button variant="secondary" size="sm" onClick={handleToggleFinal} disabled={!selectedNodeId}>Toggle Final state</Button>
            </div>
          </Card>

          {/* Transition editor */}
          <Card glass style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase' }}>Connector Linker</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text-dimmed)' }}>Source State</label>
              <select value={newTransFrom} onChange={(e) => setNewTransFrom(e.target.value)} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', padding: '5px', borderRadius: '4px', fontSize: '12px' }}>
                <option value="">-- select --</option>
                {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text-dimmed)' }}>Target State</label>
              <select value={newTransTo} onChange={(e) => setNewTransTo(e.target.value)} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', padding: '5px', borderRadius: '4px', fontSize: '12px' }}>
                <option value="">-- select --</option>
                {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text-dimmed)' }}>Symbol</label>
              <select value={newTransSymbol} onChange={(e) => setNewTransSymbol(e.target.value)} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', padding: '5px', borderRadius: '4px', fontSize: '12px' }}>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="ε">ε</option>
              </select>
            </div>
            <Button variant="primary" size="sm" onClick={handleAddTransition} disabled={!newTransFrom || !newTransTo}>Add path</Button>

            {selectedEdgeId && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <label style={{ fontSize: '10px', color: 'var(--accent-cyan)' }}>Edit Selected symbols</label>
                <input type="text" value={edges.find(e => e.id === selectedEdgeId)?.symbols.join(', ') || ''} onChange={(e) => handleUpdateEdgeSymbols(e.target.value)} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-main)', padding: '5px', borderRadius: '4px', fontSize: '12px' }} />
                <Button variant="outline" size="sm" onClick={handleDeleteTransition}>Remove transition</Button>
              </div>
            )}
          </Card>

          {/* Local files */}
          <Card glass style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>File Operations</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Button variant="outline" size="sm" onClick={saveLocally}>Save Local</Button>
              <Button variant="outline" size="sm" onClick={loadLocally}>Load Local</Button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Button variant="outline" size="sm" onClick={exportJSON}>Export JSON</Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Import JSON</Button>
            </div>
            <input type="file" ref={fileInputRef} onChange={importJSON} style={{ display: 'none' }} accept=".json" />
            <Button variant="secondary" size="sm" onClick={handleClear} style={{ marginTop: '4px' }}>Clear Canvas</Button>
          </Card>

        </div>

        {/* ================= CENTER PANEL: NFA CANVAS ================= */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.25)', position: 'relative' }}>
          
          <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10, display: 'flex', gap: '6px' }}>
            <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}><ZoomOutIcon /></Button>
            <Button variant="outline" size="sm" onClick={() => setZoom(1)}>100%</Button>
            <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(2.0, z + 0.1))}><ZoomInIcon /></Button>
          </div>

          <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, display: 'flex', gap: '8px' }}>
            <Button variant="primary" size="sm" onClick={computeSubsetConstruction} glow>Load Subset conversion</Button>
          </div>

          {/* Interactive NFA SVG Canvas */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <svg 
              width="100%" 
              height="100%" 
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ cursor: isPanning ? 'grabbing' : 'default' }}
            >
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="24" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--graph-arrow)" />
                </marker>
              </defs>

              {/* Grid Background Pattern */}
              <pattern id="grid-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill="var(--border-subtle)" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />

              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                
                {/* Outward edges */}
                {edges.map(drawEdgeLine)}

                {/* Nodes rendering */}
                {nodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  let color = 'var(--graph-node-border)';
                  if (isSelected) color = 'var(--accent-cyan)';

                  return (
                    <g 
                      key={node.id} 
                      transform={`translate(${node.x}, ${node.y})`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggedNodeId(node.id);
                        setSelectedNodeId(node.id);
                      }}
                      style={{ cursor: 'grab' }}
                    >
                      <circle r="22" fill="var(--graph-node-bg)" stroke={color} strokeWidth={isSelected ? '2.5' : '1.5'} />
                      
                      {node.isFinal && (
                        <circle r="18" fill="none" stroke={color} strokeWidth="1" />
                      )}

                      {node.isStart && (
                        <path d="M -35 0 L -22 0" stroke="var(--graph-start-arrow)" strokeWidth="1.5" markerEnd="url(#arrow)" />
                      )}

                      <text y="4" textAnchor="middle" fill="var(--graph-node-text)" fontSize="12" fontWeight="700" style={{ userSelect: 'none' }}>
                        {node.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Conversion Stepper Deck Controls */}
          {steps.length > 0 && (
            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Conversion Step: <strong style={{ color: 'var(--accent-cyan)' }}>{stepIdx + 1}</strong> of <strong>{steps.length}</strong>
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="outline" size="sm" onClick={() => setStepIdx(prev => Math.max(0, prev - 1))} disabled={stepIdx <= 0}>
                    Previous Step
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setStepIdx(prev => Math.min(steps.length - 1, prev + 1))} disabled={stepIdx >= steps.length - 1}>
                    Next Step
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setIsPlaying(!isPlaying)} glow>
                    {isPlaying ? '⏸️ Pause' : '▶ Play Animation'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={resetConversion}>
                    Reset Conversion
                  </Button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="academy-progress-bar-bg" style={{ height: '4px' }}>
                <div className="academy-progress-bar-fill" style={{ width: `${Math.round(((stepIdx + 1) / steps.length) * 100)}%`, background: 'var(--accent-cyan)' }} />
              </div>
            </div>
          )}
        </div>

        {/* ================= RIGHT PANEL: DFA OUTPUT ================= */}
        <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '1px solid var(--border-subtle)', padding: '16px', overflowY: 'auto' }}>
          
          {steps.length === 0 ? (
            <Card glass style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
              <h3>No conversion computed</h3>
              <p style={{ fontSize: '12.5px', marginTop: '6px' }}>Setup your NFA graph in the canvas and click "Load Subset conversion" to begin.</p>
            </Card>
          ) : (
            (() => {
              const currentStep = steps[stepIdx];
              if (!currentStep) return null;
              
              const isFinished = stepIdx === steps.length - 1;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Generated DFA Graph Display */}
                  <Card glass style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>DFA Target Diagram</span>
                    {drawDfaGraph()}
                  </Card>

                  {/* Step Explanation card */}
                  {showExplanations && (
                    <Card glass style={{ padding: '14px', border: '1px solid var(--accent-cyan)', background: 'var(--bg-hover)', display: 'flex', flexDirection: 'column', gap: '6px' }} className="animate-scale-in">
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>Step Explanations</span>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-main)', lineHeight: 1.45 }}>{currentStep.explanation}</p>
                    </Card>
                  )}

                  {/* State Subsets Mapping */}
                  <Card glass style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase' }}>Powerset mappings table</span>
                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                          <th style={{ padding: '4px' }}>DFA State</th>
                          <th style={{ padding: '4px' }}>NFA Subset</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(currentStep.stateMappings).map(([dfaLabel, nfaStates]) => {
                          const isActive = currentStep.targetDfaStateLabel === dfaLabel;
                          return (
                            <tr key={dfaLabel} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: isActive ? 'rgba(123,97,255,0.1)' : 'transparent' }}>
                              <td style={{ padding: '5px', fontWeight: 700, color: 'var(--accent-purple)' }}>{dfaLabel}</td>
                              <td style={{ padding: '5px', fontFamily: 'var(--font-mono)' }}>{nfaStates.length === 0 ? 'Ø' : `{ ${nfaStates.join(', ')} }`}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </Card>

                  {/* DFA transition table */}
                  <Card glass style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>DFA transition matrix</span>
                    <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'center' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '4px', textAlign: 'left' }}>State</th>
                          <th style={{ padding: '4px' }}>Input 0</th>
                          <th style={{ padding: '4px' }}>Input 1</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(currentStep.stateMappings).map(([dfaLabel, nfaStates]) => {
                          const t0 = currentStep.dfaTransitions.find((t) => t.from === dfaLabel && t.symbol === '0')?.to || '-';
                          const t1 = currentStep.dfaTransitions.find((t) => t.from === dfaLabel && t.symbol === '1')?.to || '-';
                          const isRowActive = currentStep.dfaStateLabel === dfaLabel;

                          return (
                            <tr key={dfaLabel} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: isRowActive ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                              <td style={{ padding: '5px', fontWeight: 700, textAlign: 'left' }}>{dfaLabel} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({nfaStates.join(', ')})</span></td>
                              <td style={{ padding: '5px', fontFamily: 'var(--font-mono)' }}>{t0}</td>
                              <td style={{ padding: '5px', fontFamily: 'var(--font-mono)' }}>{t1}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </Card>

                  {/* Final metrics summary on completion */}
                  {isFinished && (
                    <Card glass style={{ padding: '14px', border: '1px solid var(--accent-success)', background: 'rgba(16,185,129,0.03)', display: 'flex', flexDirection: 'column', gap: '8px' }} className="animate-scale-in">
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-success)', textTransform: 'uppercase' }}>🏆 Conversion Complete</span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12.5px' }}>
                        <div>DFA States: <strong>{currentStep.dfaStatesList.length}</strong></div>
                        <div>Accepting: <strong>{currentStep.dfaStatesList.filter(s => s.isFinal).length}</strong></div>
                      </div>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4, marginTop: '4px' }}>
                        The power subset construction successfully reduced the non-deterministic transition system into a deterministic equivalent model.
                      </p>
                    </Card>
                  )}

                </div>
              );
            })()
          )}

        </div>

      </div>

    </div>
  );
};

export default NfaConverter;
