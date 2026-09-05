const { GoogleGenAI } = require('@google/genai');

// Initialize Google Gen AI client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Gemini Service] Warning: GEMINI_API_KEY environment variable is not defined.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || 'dummy-key-to-prevent-sdk-error',
  });
};

const ai = getGeminiClient();

// Helper to validate structured FSM JSON schema
const validateAutomatonJSON = (json) => {
  if (!json || typeof json !== 'object') return false;
  if (json.type !== 'DFA' && json.type !== 'NFA') return false;
  if (typeof json.title !== 'string') return false;
  if (!Array.isArray(json.alphabet) || json.alphabet.length === 0) return false;
  if (!Array.isArray(json.states) || json.states.length === 0) return false;
  if (!Array.isArray(json.transitions)) return false;
  if (typeof json.description !== 'string') return false;

  // 1. Every state ID is unique
  const stateIds = new Set();
  let startStateCount = 0;
  let acceptStateCount = 0;

  for (const s of json.states) {
    if (!s || typeof s !== 'object' || typeof s.id !== 'string') {
      return false;
    }
    if (stateIds.has(s.id)) {
      return false; // Duplicate state ID
    }
    stateIds.add(s.id);

    if (s.start === true) {
      startStateCount++;
    }
    if (s.accept === true) {
      acceptStateCount++;
    }
  }

  // 2. Exactly one start state
  if (startStateCount !== 1) return false;

  // 3. Accepting states exist
  if (acceptStateCount < 1) return false;

  // 4. Every transition source and destination exists
  // 5. Alphabet symbols are valid
  // 6. No duplicate transitions (same from, to, and symbol)
  const transitionKeys = new Set();

  for (const t of json.transitions) {
    if (!t || typeof t !== 'object' || typeof t.from !== 'string' || typeof t.to !== 'string' || typeof t.symbol !== 'string') {
      return false;
    }
    if (!stateIds.has(t.from) || !stateIds.has(t.to)) {
      return false; // References non-existent state
    }
    
    // symbol check: must be in alphabet or epsilon
    const isEpsilon = t.symbol === 'ε' || t.symbol === 'e' || t.symbol === 'epsilon' || t.symbol === '';
    if (!isEpsilon && !json.alphabet.includes(t.symbol)) {
      return false; // Invalid symbol
    }

    const key = `${t.from}->${t.to}:${t.symbol}`;
    if (transitionKeys.has(key)) {
      return false; // Duplicate transition
    }
    transitionKeys.add(key);
  }

  // 7. DFA contains exactly one outgoing transition for every alphabet symbol for every state
  if (json.type === 'DFA') {
    for (const sId of Array.from(stateIds)) {
      for (const sym of json.alphabet) {
        const matching = json.transitions.filter(t => t.from === sId && t.symbol === sym);
        if (matching.length !== 1) {
          return false; // DFA violation: not exactly one transition
        }
      }
    }
  }

  // 8. No dangling nodes: every state must be reachable from the start state
  const startStateNode = json.states.find(s => s.start === true);
  if (!startStateNode) return false;
  
  const startState = startStateNode.id;
  const visited = new Set();
  const queue = [startState];
  visited.add(startState);

  while (queue.length > 0) {
    const curr = queue.shift();
    const neighbors = json.transitions.filter(t => t.from === curr).map(t => t.to);
    for (const n of neighbors) {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push(n);
      }
    }
  }

  if (visited.size !== json.states.length) {
    return false; // Unreachable node found
  }

  return true;
};

const OFFLINE_AUTOMATA_FALLBACKS = [
  {
    keywords: ['ending with 01', 'ends with 01'],
    json: {
      type: "DFA",
      title: "DFA: Strings ending with '01'",
      alphabet: ["0", "1"],
      states: [
        { id: "q0", start: true, accept: false },
        { id: "q1", accept: false },
        { id: "q2", accept: true }
      ],
      transitions: [
        { from: "q0", to: "q1", symbol: "0" },
        { from: "q0", to: "q0", symbol: "1" },
        { from: "q1", to: "q1", symbol: "0" },
        { from: "q1", to: "q2", symbol: "1" },
        { from: "q2", to: "q1", symbol: "0" },
        { from: "q2", to: "q0", symbol: "1" }
      ],
      description: "This DFA accepts binary strings that end with the suffix '01'. State q0 represents having seen '1' or no characters yet. State q1 represents having just matched '0'. State q2 is the accepting state representing a successful '01' match."
    }
  },
  {
    keywords: ['starting with 10', 'starts with 10'],
    json: {
      type: "DFA",
      title: "DFA: Strings starting with '10'",
      alphabet: ["0", "1"],
      states: [
        { id: "q0", start: true, accept: false },
        { id: "q1", accept: false },
        { id: "q2", accept: true },
        { id: "qt", accept: false }
      ],
      transitions: [
        { from: "q0", to: "qt", symbol: "0" },
        { from: "q0", to: "q1", symbol: "1" },
        { from: "q1", to: "q2", symbol: "0" },
        { from: "q1", to: "qt", symbol: "1" },
        { from: "q2", to: "q2", symbol: "0" },
        { from: "q2", to: "q2", symbol: "1" },
        { from: "qt", to: "qt", symbol: "0" },
        { from: "qt", to: "qt", symbol: "1" }
      ],
      description: "This DFA accepts all binary strings that start with the prefix '10'. Any string starting with '0' or '11' is immediately sent to the dead/trap state qt. Correct strings reach accepting state q2 and stay there for any remaining characters."
    }
  },
  {
    keywords: ['containing 101', 'contains 101'],
    json: {
      type: "DFA",
      title: "DFA: Substring '101' detection",
      alphabet: ["0", "1"],
      states: [
        { id: "q0", start: true, accept: false },
        { id: "q1", accept: false },
        { id: "q2", accept: false },
        { id: "q3", accept: true }
      ],
      transitions: [
        { from: "q0", to: "q0", symbol: "0" },
        { from: "q0", to: "q1", symbol: "1" },
        { from: "q1", to: "q2", symbol: "0" },
        { from: "q1", to: "q1", symbol: "1" },
        { from: "q2", to: "q0", symbol: "0" },
        { from: "q2", to: "q3", symbol: "1" },
        { from: "q3", to: "q3", symbol: "0" },
        { from: "q3", to: "q3", symbol: "1" }
      ],
      description: "This DFA accepts binary strings that contain the sequence '101' as a substring. State q0 has not seen '1', q1 has matched '1', q2 has matched '10', and q3 is the permanent accepting state representing a successful '101' match."
    }
  },
  {
    keywords: ['even number of 0', 'even number of 0s', 'even 0'],
    json: {
      type: "DFA",
      title: "DFA: Even number of '0's",
      alphabet: ["0", "1"],
      states: [
        { id: "q_even", start: true, accept: true },
        { id: "q_odd", accept: false }
      ],
      transitions: [
        { from: "q_even", to: "q_odd", symbol: "0" },
        { from: "q_even", to: "q_even", symbol: "1" },
        { from: "q_odd", to: "q_even", symbol: "0" },
        { from: "q_odd", to: "q_odd", symbol: "1" }
      ],
      description: "This DFA accepts binary strings containing an even number of '0's. State q_even tracks an even parity of '0's (and is the accepting start state), whereas state q_odd tracks an odd parity of '0's. Reading '1' does not affect the parity."
    }
  },
  {
    keywords: ['odd number of 1', 'odd number of 1s', 'odd 1'],
    json: {
      type: "DFA",
      title: "DFA: Odd number of '1's",
      alphabet: ["0", "1"],
      states: [
        { id: "q_even", start: true, accept: false },
        { id: "q_odd", accept: true }
      ],
      transitions: [
        { from: "q_even", to: "q_even", symbol: "0" },
        { from: "q_even", to: "q_odd", symbol: "1" },
        { from: "q_odd", to: "q_odd", symbol: "0" },
        { from: "q_odd", to: "q_even", symbol: "1" }
      ],
      description: "This DFA accepts binary strings containing an odd number of '1's. State q_even represents an even parity of '1's, while state q_odd represents an odd parity (and is the accepting state). Modulo 2 parity arithmetic updates state targets."
    }
  },
  {
    keywords: ['(a+b)*abb', 'ending with abb', 'ends with abb'],
    json: {
      type: "NFA",
      title: "NFA: Regular expression (a+b)*abb",
      alphabet: ["a", "b"],
      states: [
        { id: "q0", start: true, accept: false },
        { id: "q1", accept: false },
        { id: "q2", accept: false },
        { id: "q3", accept: true }
      ],
      transitions: [
        { from: "q0", to: "q0", symbol: "a" },
        { from: "q0", to: "q0", symbol: "b" },
        { from: "q0", to: "q1", symbol: "a" },
        { from: "q1", to: "q2", symbol: "b" },
        { from: "q2", to: "q3", symbol: "b" }
      ],
      description: "This is a non-deterministic finite automaton (NFA) for the language of strings ending with 'abb'. From the start state q0, the machine non-deterministically stays at q0 or branches to q1 upon reading 'a'. Following the sequence 'a', 'b', 'b' leads to accepting state q3."
    }
  },
  {
    keywords: ['epsilon nfa', 'epsilon transitions', 'ε-nfa', 'ε-nfa examples'],
    json: {
      type: "NFA",
      title: "ε-NFA: Epsilon Transitions Example",
      alphabet: ["0", "1"],
      states: [
        { id: "q0", start: true, accept: false },
        { id: "q1", accept: false },
        { id: "q2", accept: true }
      ],
      transitions: [
        { from: "q0", to: "q0", symbol: "0" },
        { from: "q0", to: "q1", symbol: "ε" },
        { from: "q1", to: "q1", symbol: "1" },
        { from: "q1", to: "q2", symbol: "ε" },
        { from: "q2", to: "q2", symbol: "0" }
      ],
      description: "This is an ε-NFA accepting strings that match the pattern 0*1*0*. Epsilon transitions (ε) allow state changes without consuming input symbols, enabling the machine to skip from q0 to q1 and from q1 to q2."
    }
  }
];

/**
 * Service to handle Google Gemini API interactions using the AI Studio generated patterns
 */
const geminiService = {
  /**
   * Explain a DFA or NFA concept in simple language, with support for structured FSM JSON generation
   */
  async explainConcept(question, image) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured.');
    }

    const modelName = process.env.GEMINI_MODEL || 'models/gemini-3-flash-preview';
    const questionLower = (question || '').toLowerCase();

    // Set up contents for multimodal call
    let inlineImagePart = null;
    if (image && image.data && image.mimeType) {
      inlineImagePart = {
        inlineData: {
          data: image.data,
          mimeType: image.mimeType
        }
      };
    }

    const hasCreationVerb = 
      questionLower.includes('create') ||
      questionLower.includes('draw') ||
      questionLower.includes('build') ||
      questionLower.includes('construct') ||
      questionLower.includes('generate') ||
      questionLower.includes('design') ||
      questionLower.includes('synthesize') ||
      questionLower.includes('convert') ||
      questionLower.includes('correct') ||
      questionLower.includes('simplify') ||
      questionLower.includes('simpler') ||
      questionLower.includes('make');

    const hasAutomatonNoun = 
      questionLower.includes('dfa') ||
      questionLower.includes('nfa') ||
      questionLower.includes('automaton') ||
      questionLower.includes('automata') ||
      questionLower.includes('state machine') ||
      questionLower.includes('transition diagram') ||
      (inlineImagePart && questionLower.includes('this'));

    const isConstructionRequest = (hasCreationVerb && hasAutomatonNoun) || 
                                  (inlineImagePart && questionLower.trim() === '');

    // Don't treat explanation/description requests as JSON constructions
    const isConstruction = isConstructionRequest && 
                           !questionLower.includes('explain') && 
                           !questionLower.includes('describe') && 
                           !questionLower.includes('what is');

    if (isConstruction) {
      console.log(`[Gemini Service] Detected Automaton Construction request. Querying JSON schema...`);

      const jsonSystemInstruction = `You are a structured Automata Theory generator.
Your job is to construct a DFA, NFA, or ε-NFA for the requested regular language (or solve the task/diagram provided in the uploaded image) and return ONLY a valid JSON object.
Do NOT wrap the JSON in markdown code blocks, and do NOT include any explanation outside the JSON.
Never return ASCII art diagrams or drawings.

The JSON structure must match this exact format:
{
  "type": "DFA",
  "title": "Strings ending with 101",
  "alphabet": ["0", "1"],
  "states": [
      {"id": "q0", "start": true, "accept": false},
      {"id": "q1", "accept": false},
      {"id": "q2", "accept": true},
      {"id": "qt", "accept": false}
  ],
  "transitions": [
      {"from": "q0", "to": "q1", "symbol": "0"},
      {"from": "q1", "to": "q2", "symbol": "1"}
  ],
  "description": "Brief explanation of how the states read alphabet symbols and process transitions."
}

Rules:
1. Every state "id" in "states" must be unique. Exactly one state must have "start": true. At least one state must have "accept": true.
2. Every state referenced in "transitions" ("from" and "to") must exist in the "states" list.
3. If type is DFA, every state MUST have exactly one transition for each symbol in the alphabet (e.g. if alphabet has 'a' and 'b', each state must have exactly one 'a' transition and exactly one 'b' transition; use an explicit dead/trap state like 'qt' or 'q_trap' if needed).
4. If type is NFA/ε-NFA, states can have multiple transitions for the same symbol (or none). Epsilon transitions are labeled 'ε' (or 'e' or 'epsilon') and do not need to be in the alphabet list.
5. No duplicate transitions (no two transitions have the same from, to, and symbol).
6. No dangling nodes: every state in the states list must be reachable from the start state using a path in the transition graph.
7. Never output LaTeX mathematical syntax (like $, $$, \\( \\), etc.). Write math expressions in plain text.
8. Never output raw HTML.
9. ALWAYS PREFER THE SIMPLEST VALID AUTOMATON (CORRECT + MINIMAL/SIMPLE + EASY TO UNDERSTAND + EASY TO DRAW). Ask internally: "What is the minimum information the machine actually needs to remember?" and create states based ONLY on that. Strongly prefer 2 states if 2 are sufficient, 3 states if 3 are sufficient, 4 states only when genuinely necessary. Do NOT generate 5, 6, 7+ states for a basic language unless mathematically unavoidable. Completely remove all unreachable states. For NFA-to-DFA conversion, explore and list ONLY reachable subsets starting from the initial subset, completely removing unreachable subsets.`;

      let attempt = 1;
      let lastError = null;

      while (attempt <= 2) {
        try {
          console.log(`[Gemini Service] JSON Attempt ${attempt} on model: "${modelName}"`);
          
          let contents = [];
          if (inlineImagePart) {
            contents.push(inlineImagePart);
          }
          
          const promptText = attempt === 1 
            ? (question || 'Generate the corresponding automaton JSON for the provided image.') 
            : `Your previous response did not return a valid JSON object matching the requested schema. Please output ONLY the raw JSON object matching the schema: ${question || ''}`;
          
          contents.push(promptText);

          const response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction: jsonSystemInstruction,
              responseMimeType: 'application/json'
            }
          });

          let text = response.text || '';
          let cleanText = text.trim();
          
          // Strip potential markdown code blocks if the model included them anyway
          if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
          }

          const parsed = JSON.parse(cleanText);
          if (validateAutomatonJSON(parsed)) {
            console.log(`[Gemini Service] Success! Valid structured Automaton JSON generated on attempt ${attempt}.`);
            return JSON.stringify(parsed);
          } else {
            console.warn(`[Gemini Service] Attempt ${attempt} failed validation checks.`);
            lastError = new Error('Automaton schema validation failed.');
          }
        } catch (err) {
          console.warn(`[Gemini Service] Attempt ${attempt} failed:`, err.message || err);
          lastError = err;
        }
        attempt++;
      }

      // Check if we have an offline fallback for this language request
      for (const fb of OFFLINE_AUTOMATA_FALLBACKS) {
        if (fb.keywords.some(kw => questionLower.includes(kw))) {
          console.log(`[Gemini Service] API failed but found offline fallback for keywords: [${fb.keywords.join(', ')}]`);
          return JSON.stringify(fb.json);
        }
      }

      throw lastError || new Error('Failed to generate a valid structured Automaton configuration after retry.');
    } else {
      // Normal conceptual text-based request
      console.log(`[Gemini Service] Conceptual request. Querying markdown tutor...`);
      
      let contents = [];
      if (inlineImagePart) {
        contents.push(inlineImagePart);
      }
      
      const defaultPrompt = 'Explain this image and its automata concepts. If there is a handwritten or textbook question, please solve and explain it step-by-step.';
      contents.push(question ? question : defaultPrompt);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: `You are AutomataVerse AI Tutor. Your audience is undergraduate Computer Science students.
Always answer in clean GitHub Markdown.

Behave like a patient undergraduate Automata Theory teacher:
- Explain in simple language, avoid unnecessarily advanced terminology or overly long explanations.
- Prefer tables over huge paragraphs.
- Start with the simplest interpretation, build step-by-step, and explain why each state is needed.
- Prefer fewer states; never remove a state or transition if it makes the automaton mathematically incorrect. Correctness always comes first, but simplify and avoid overengineering.
- STRICT STATE LIMIT / SIMPLICITY RULE: Ask internally: "What is the minimum information the machine actually needs to remember?" and construct the automaton using ONLY those states. Strongly prefer 2 states if 2 are sufficient, 3 states if 3 are sufficient, 4 states only when genuinely necessary. Do NOT generate 5, 6, 7+ states unless mathematically unavoidable. Completely remove all unreachable states.
- For NFA to DFA conversion: Use standard subset construction. Explore and generate ONLY reachable subsets from the initial ε-closure subset. Do NOT list/generate all mathematically possible subsets.
- If minimization is not explicitly asked, do NOT perform minimization. If minimization IS requested, show initial partition, refinement, final groups, and minimized DFA step-by-step.
- For NFA, use non-determinism only when it simplifies the construction. Explain multiple transitions clearly (e.g., "On input a, the NFA can stay in q0 OR move to q1").
- For ε-NFA, use ε-transitions only when they simplify the construction. Explain: "ε means the machine can move without consuming an input symbol."
- If the uploaded image contains handwritten notes, diagrams, or questions, first read the handwriting or parse the diagram, rewrite the problem clearly, and solve/explain it. If anything is unclear, ask the user to clarify instead of assuming.

For automata construction questions, use this response format structure:
### Idea
One or two sentences explaining what the automaton needs to remember.

### States
q0 → [meaning, e.g., "the string does not currently end in a"]
q1 → [meaning, e.g., "the string currently ends in a"]

### Start State
q0

### Final State(s)
q1

### Transition Table
[Markdown table showing state transitions]

### Simple Explanation
Explain how the DFA/NFA works in a few sentences.

### Diagram
Generate the corresponding clean diagram description or FSM representation.

Rules:
- Never output LaTeX mathematical syntax (like $, $$, \\( \\), \\[ \\]). Write math in plain text.
- Use headings (## / ###), bullet points, and tables.
- Never output raw HTML.
- Keep explanations concise and student-friendly.`
        }
      });

      if (!response || !response.text) {
        throw new Error('Gemini API returned an empty or invalid text response.');
      }

      console.log(`[Gemini Service] Success! Markdown content generated successfully.`);
      return response.text;
    }
  }
};

module.exports = geminiService;
