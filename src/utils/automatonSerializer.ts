// AutomataVerse Canonical Automaton Serializer and Import Validator
// Preserves state coordinates, names, start/final state flags, transitions, labels, and DFA/NFA types.

export interface StateNode {
  id: string;
  name: string;
  x: number;
  y: number;
  isStart: boolean;
  isFinal: boolean;
}

export interface TransitionEdge {
  id: string;
  from: string;
  to: string;
  symbols: string[];
}

export interface ExportedAutomatonData {
  version: string;
  type: 'DFA' | 'NFA' | 'ε-NFA';
  alphabet: string[];
  nodes: StateNode[];
  edges: TransitionEdge[];
  title?: string;
  description?: string;
}

export interface ImportValidationResult {
  isValid: boolean;
  type: 'DFA' | 'NFA' | 'ε-NFA';
  nodes: StateNode[];
  edges: TransitionEdge[];
  alphabet: string[];
  error?: string;
}

export function isEpsilonSymbol(sym: string): boolean {
  if (!sym) return false;
  const s = sym.trim().toLowerCase();
  return s === '' || s === 'ε' || s === 'epsilon' || s === 'eps';
}

export function normalizeTransitionSymbol(sym: string): string {
  const trimmed = sym.trim();
  if (isEpsilonSymbol(trimmed)) {
    return 'ε';
  }
  return trimmed;
}

export function validateAndImportAutomaton(jsonInput: unknown): ImportValidationResult {
  let parsed: any = jsonInput;

  if (typeof jsonInput === 'string') {
    try {
      parsed = JSON.parse(jsonInput);
    } catch (e: any) {
      return {
        isValid: false,
        type: 'NFA',
        nodes: [],
        edges: [],
        alphabet: [],
        error: 'Invalid JSON format: Failed to parse JSON syntax.'
      };
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      isValid: false,
      type: 'NFA',
      nodes: [],
      edges: [],
      alphabet: [],
      error: 'Invalid JSON format: Expected a JSON object at root level.'
    };
  }

  // Determine Automaton Type
  let rawTypeStr = String(parsed.type || parsed.automatonType || 'NFA').toUpperCase();
  let type: 'DFA' | 'NFA' | 'ε-NFA' = 'NFA';
  if (rawTypeStr.includes('DFA') && !rawTypeStr.includes('NFA')) {
    type = 'DFA';
  } else if (rawTypeStr.includes('ε') || rawTypeStr.includes('EPS')) {
    type = 'ε-NFA';
  } else {
    type = 'NFA';
  }

  // Support both 'nodes' and 'states' schemas
  const rawNodes = parsed.nodes || parsed.states;
  if (!rawNodes || !Array.isArray(rawNodes) || rawNodes.length === 0) {
    return {
      isValid: false,
      type,
      nodes: [],
      edges: [],
      alphabet: [],
      error: `Invalid ${type} JSON: Missing or empty "nodes" (or "states") array.`
    };
  }

  // Support both 'edges' and 'transitions' schemas
  const rawEdges = parsed.edges || parsed.transitions;
  if (!rawEdges || !Array.isArray(rawEdges)) {
    return {
      isValid: false,
      type,
      nodes: [],
      edges: [],
      alphabet: [],
      error: `Invalid ${type} JSON: Missing "edges" (or "transitions") array.`
    };
  }

  // Validate and Normalize Nodes
  const nodeIdSet = new Set<string>();
  const nodes: StateNode[] = [];
  let startCount = 0;

  for (let i = 0; i < rawNodes.length; i++) {
    const n = rawNodes[i];
    if (!n || typeof n !== 'object') {
      return {
        isValid: false,
        type,
        nodes: [],
        edges: [],
        alphabet: [],
        error: `Invalid ${type} JSON: Node at index ${i} is not a valid object.`
      };
    }

    const id = String(n.id || n.name || n.key || '').trim();
    if (!id) {
      return {
        isValid: false,
        type,
        nodes: [],
        edges: [],
        alphabet: [],
        error: `Invalid ${type} JSON: Node at index ${i} is missing a required "id" string.`
      };
    }

    if (nodeIdSet.has(id)) {
      return {
        isValid: false,
        type,
        nodes: [],
        edges: [],
        alphabet: [],
        error: `Invalid ${type} JSON: Duplicate node ID "${id}" detected.`
      };
    }
    nodeIdSet.add(id);

    const name = String(n.name || n.label || id);
    const x = typeof n.x === 'number' ? n.x : (150 + (i % 4) * 160);
    const y = typeof n.y === 'number' ? n.y : (180 + Math.floor(i / 4) * 100);

    const isStart = Boolean(n.isStart ?? n.start ?? n.initial ?? false);
    const isFinal = Boolean(n.isFinal ?? n.isAccepting ?? n.accept ?? n.final ?? false);

    if (isStart) startCount++;

    nodes.push({ id, name, x, y, isStart, isFinal });
  }

  if (startCount === 0) {
    return {
      isValid: false,
      type,
      nodes: [],
      edges: [],
      alphabet: [],
      error: `Invalid ${type} JSON: Start state missing. At least one state must have isStart: true.`
    };
  }

  // Validate and Normalize Edges
  const edges: TransitionEdge[] = [];
  for (let i = 0; i < rawEdges.length; i++) {
    const e = rawEdges[i];
    if (!e || typeof e !== 'object') {
      return {
        isValid: false,
        type,
        nodes: [],
        edges: [],
        alphabet: [],
        error: `Invalid ${type} JSON: Transition edge at index ${i} is not a valid object.`
      };
    }

    const from = String(e.from || e.source || '').trim();
    const to = String(e.to || e.target || '').trim();

    if (!from) {
      return {
        isValid: false,
        type,
        nodes: [],
        edges: [],
        alphabet: [],
        error: `Invalid ${type} JSON: Edge at index ${i} is missing source "from" field.`
      };
    }

    if (!to) {
      return {
        isValid: false,
        type,
        nodes: [],
        edges: [],
        alphabet: [],
        error: `Invalid ${type} JSON: Edge at index ${i} is missing destination "to" field.`
      };
    }

    if (!nodeIdSet.has(from)) {
      return {
        isValid: false,
        type,
        nodes: [],
        edges: [],
        alphabet: [],
        error: `Invalid ${type} JSON: Edge references non-existent source state "${from}".`
      };
    }

    if (!nodeIdSet.has(to)) {
      return {
        isValid: false,
        type,
        nodes: [],
        edges: [],
        alphabet: [],
        error: `Invalid ${type} JSON: Edge references non-existent destination state "${to}".`
      };
    }

    // Extract symbols
    let symbols: string[] = [];
    if (Array.isArray(e.symbols)) {
      symbols = e.symbols.flatMap((s: any) => String(s).split(',').map((x: string) => normalizeTransitionSymbol(x))).filter(Boolean);
    } else if (typeof e.symbols === 'string') {
      symbols = e.symbols.split(',').map((x: string) => normalizeTransitionSymbol(x)).filter(Boolean);
    } else if (typeof e.symbol === 'string') {
      symbols = e.symbol.split(',').map((x: string) => normalizeTransitionSymbol(x)).filter(Boolean);
    } else if (typeof e.label === 'string') {
      symbols = e.label.split(',').map((x: string) => normalizeTransitionSymbol(x)).filter(Boolean);
    }

    if (symbols.length === 0) {
      symbols = ['0'];
    }

    const edgeId = String(e.id || `e_${from}_${to}_${i}`);
    edges.push({ id: edgeId, from, to, symbols });
  }

  // Extract / Derive Alphabet (strictly excluding epsilon transitions)
  let alphabet: string[] = [];
  if (Array.isArray(parsed.alphabet)) {
    alphabet = parsed.alphabet.map((s: any) => String(s).trim()).filter((s: string) => !isEpsilonSymbol(s));
  }

  if (alphabet.length === 0) {
    const extracted = new Set<string>();
    for (const edge of edges) {
      for (const sym of edge.symbols) {
        if (!isEpsilonSymbol(sym)) {
          extracted.add(sym);
        }
      }
    }
    alphabet = Array.from(extracted).sort();
  }

  if (alphabet.length === 0) {
    alphabet = ['0', '1'];
  }

  return {
    isValid: true,
    type,
    nodes,
    edges,
    alphabet
  };
}

export function exportAutomatonJSON(
  nodes: StateNode[],
  edges: TransitionEdge[],
  type: 'DFA' | 'NFA' | 'ε-NFA' = 'NFA',
  providedAlphabet?: string[]
): void {
  const extractedAlphabet = new Set<string>();
  for (const e of edges) {
    for (const sym of e.symbols) {
      if (!isEpsilonSymbol(sym)) {
        extractedAlphabet.add(sym.trim());
      }
    }
  }

  const alphabet = providedAlphabet && providedAlphabet.length > 0
    ? providedAlphabet
    : (extractedAlphabet.size > 0 ? Array.from(extractedAlphabet).sort() : ['0', '1']);

  const payload: ExportedAutomatonData = {
    version: '1.0',
    type,
    alphabet,
    nodes: nodes.map(n => ({
      id: n.id,
      name: n.name,
      x: Math.round(n.x),
      y: Math.round(n.y),
      isStart: Boolean(n.isStart),
      isFinal: Boolean(n.isFinal)
    })),
    edges: edges.map(e => ({
      id: e.id,
      from: e.from,
      to: e.to,
      symbols: [...e.symbols]
    }))
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonStr);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `automataverse_${type.toLowerCase().replace(/[^a-z0-9]/g, '')}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importAutomatonJSONFile(
  file: File,
  onSuccess: (result: ImportValidationResult) => void,
  onError: (errorMsg: string) => void
): void {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const content = event.target?.result as string;
      const validated = validateAndImportAutomaton(content);
      if (validated.isValid) {
        onSuccess(validated);
      } else {
        onError(validated.error || 'Invalid JSON format.');
      }
    } catch (err: any) {
      onError('Failed to parse JSON file: ' + (err?.message || 'Syntax error'));
    }
  };
  reader.readAsText(file);
}
