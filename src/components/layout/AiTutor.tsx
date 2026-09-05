import React, { useState, useEffect, useRef } from 'react';
import './AiTutor.css';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { apiService } from '../../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AutomataDiagram } from '../ui/AutomataDiagram';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  image?: { data: string; mimeType: string };
}

const TOPICS_ANSWERS: Record<string, string> = {
  'dfa-nfa': `### DFA vs NFA Comparison

**Deterministic Finite Automata (DFA):**
1. For each state and input symbol, there is **exactly one** transition to a next state.
2. No epsilon (ε) transitions are allowed.
3. Easy to implement in computer code.

**Non-Deterministic Finite Automata (NFA):**
1. For a state and input symbol, there can be **zero, one, or multiple** transitions.
2. Epsilon (ε) transitions are allowed (transitioning without consuming input).
3. Highly compact to design, but requires backtracking or subset construction to simulate.`,

  'subset-construction': `### Subset (Powerset) Construction Algorithm

This algorithm translates a Non-Deterministic Finite Automaton (NFA) into an equivalent Deterministic Finite Automaton (DFA).

**Step-by-Step Flow:**
1. **Initial State:** Calculate the ε-closure of the NFA start state. This set of NFA states forms the DFA start state **A**.
2. **Transitions:** For each DFA state, determine what NFA states are reachable on each alphabet symbol.
3. **Closure:** Apply ε-closure to the reached states.
4. **Labeling:** If this set is new, define it as a new DFA state (e.g., **B**, **C**).
5. **Iteration:** Repeat until all DFA states have defined transitions for all symbols.`,

  'minimization': `### DFA State Minimization

State minimization reduces the number of states in a DFA to construct the most optimal machine that recognizes the same language.

**Algorithm (Equivalence Partitioning):**
1. **Initial Partition:** Separate states into two groups: Final states (F) and Non-Final states (Q - F).
2. **Refine Partitions:** For each group, check if transitions on any alphabet symbol lead to different groups.
3. **Split:** If states in the same group transition to different groups, split them into sub-groups.
4. **Repeat:** Repeat the refinement steps until no more splits occur.
5. **Consolidate:** Merge all equivalent states in the same final groups into single minimized nodes.`
};

const isAutomatonResponse = (text: string): boolean => {
  try {
    const trimmed = text.trim();
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return false;
    const parsed = JSON.parse(trimmed);
    return parsed && (parsed.type === 'DFA' || parsed.type === 'NFA') && Array.isArray(parsed.states) && Array.isArray(parsed.transitions);
  } catch (e) {
    return false;
  }
};

export const AiTutor: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: 'Hello! I am your AutomataVerse AI Tutor. Ask me any question about Finite State Machines, DFA to NFA conversions, or state minimization, and I will guide you through the theory!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const [isGeneratingDiagram, setIsGeneratingDiagram] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Unable to upload this image. Please try JPG, PNG, or WEBP.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('Image is too large. Please upload a smaller image.');
      return;
    }

    setUploadError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.substring(base64String.indexOf(',') + 1);
      setSelectedImage({
        data: base64Data,
        mimeType: file.type,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (text: string, imgOverride?: { data: string; mimeType: string; name: string }) => {
    const questionText = text;
    const imgToSend = imgOverride || selectedImage;
    if (!questionText.trim() && !imgToSend) return;

    const questionLower = questionText.toLowerCase();
    const hasCreationVerb = 
      questionLower.includes('create') ||
      questionLower.includes('draw') ||
      questionLower.includes('build') ||
      questionLower.includes('construct') ||
      questionLower.includes('generate') ||
      questionLower.includes('design') ||
      questionLower.includes('synthesize') ||
      questionLower.includes('make') ||
      questionLower.includes('convert') ||
      questionLower.includes('correct') ||
      questionLower.includes('simplify') ||
      questionLower.includes('simpler');

    const hasAutomatonNoun = 
      questionLower.includes('dfa') ||
      questionLower.includes('nfa') ||
      questionLower.includes('automaton') ||
      questionLower.includes('automata') ||
      questionLower.includes('state machine') ||
      questionLower.includes('transition diagram') ||
      (imgToSend && questionText.trim() === '') ||
      (imgToSend && questionLower.includes('this'));

    const isDiagramReq = !!((hasCreationVerb && hasAutomatonNoun) || (imgToSend && questionText.trim() === '') || (imgToSend && questionLower.includes('correct')));

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'user',
        text: questionText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        image: imgToSend ? { data: imgToSend.data, mimeType: imgToSend.mimeType } : undefined
      }
    ]);
    
    setInputVal('');
    setSelectedImage(null);
    setIsGeneratingDiagram(isDiagramReq);
    setIsTyping(true);

    try {
      const result = await apiService.explainConcept(
        questionText, 
        imgToSend ? { data: imgToSend.data, mimeType: imgToSend.mimeType } : undefined
      );
      setIsTyping(false);
      setIsGeneratingDiagram(false);
      
      if (!result.success) {
        throw new Error(result.error || 'Server error occurred');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'ai',
          text: result.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (error: any) {
      setIsGeneratingDiagram(false);
      setIsTyping(false);
      const errorMessage = error.message || '';
      const isConnectionIssue = 
        errorMessage.toLowerCase().includes('failed to fetch') || 
        errorMessage.toLowerCase().includes('networkerror') ||
        errorMessage.toLowerCase().includes('unreachable') ||
        errorMessage.toLowerCase().includes('cors');

      if (isConnectionIssue) {
        console.warn('[AiTutor] Backend is offline/unreachable. Falling back to offline scripts...');
        const query = questionText.toLowerCase();
        let reply = `Unable to connect to the AI backend. Please verify that the backend server is running.`;

        if (query.includes('dfa') && query.includes('nfa')) {
          reply = TOPICS_ANSWERS['dfa-nfa'];
        } else if (query.includes('subset') || query.includes('convert') || query.includes('powerset')) {
          reply = TOPICS_ANSWERS['subset-construction'];
        } else if (query.includes('minim') || query.includes('optimi') || query.includes('reduce')) {
          reply = TOPICS_ANSWERS['minimization'];
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'ai',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        console.error('[AiTutor] Gemini API call failed:', errorMessage);

        let displayError = 'An unexpected server error occurred.';
        if (errorMessage.toLowerCase().includes('key') || errorMessage.toLowerCase().includes('401')) {
          displayError = 'Invalid Gemini API key.';
        } else if (
          errorMessage.toLowerCase().includes('quota') || 
          errorMessage.toLowerCase().includes('429') ||
          errorMessage.toLowerCase().includes('exhausted')
        ) {
          displayError = 'Gemini API quota exceeded.';
        } else if (errorMessage.toLowerCase().includes('couldn\'t clearly read') || errorMessage.toLowerCase().includes('read the diagram')) {
          displayError = 'I couldn\'t clearly read the diagram. Please upload a clearer image.';
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'ai',
            text: `⚠️ **AI Tutor Connection Failed**\n\n**Reason**: ${displayError}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    }
  };

  return (
    <div className="ai-tutor-container av-tab-transition">
      <Card glass className="ai-chat-card">
        <div className="chat-header">
          <div className="tutor-avatar-mark">🤖</div>
          <div>
            <h2 className="tutor-title">AI Automata Tutor</h2>
            <span className="tutor-subtitle">Online • Theoretical Computing Expert</span>
          </div>
        </div>

        <div className="chat-messages-log">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble-row ${msg.sender}`}>
              <div className={`chat-bubble ${isAutomatonResponse(msg.text) ? 'diagram-bubble' : ''}`}>
                <div className="bubble-text" style={{ width: isAutomatonResponse(msg.text) ? '100%' : 'auto' }}>
                  {msg.image && (
                    <div className="bubble-image-container" style={{ marginBottom: '8px', borderRadius: '8px', overflow: 'hidden', maxWidth: '300px' }}>
                      <img 
                        src={`data:${msg.image.mimeType};base64,${msg.image.data}`} 
                        alt="Uploaded attachment" 
                        style={{ width: '100%', height: 'auto', display: 'block', border: '1px solid var(--border-subtle)', borderRadius: '6px' }} 
                      />
                    </div>
                  )}
                  {isAutomatonResponse(msg.text) ? (
                    <AutomataDiagram automaton={JSON.parse(msg.text)} />
                  ) : (
                    msg.text && (
                      <div className="formatted-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    )
                  )}
                </div>
                <span className="bubble-timestamp">{msg.timestamp}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-bubble-row ai">
              {isGeneratingDiagram ? (
                <div className="chat-bubble diagram-loading-bubble" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--bg-panel)', border: '1px solid var(--border-medium)', borderRadius: '12px', borderBottomLeftRadius: '2px' }}>
                  <div className="diagram-loading-spinner" style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent-purple)', animation: 'spin 0.8s linear infinite' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {selectedImage ? "Analyzing image..." : "Synthesizing Automaton..."}
                    </span>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {selectedImage ? "Gemini is parsing the attachment contents" : "Gemini is designing and validating FSM topology"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="chat-bubble typing-bubble">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              )}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="suggested-topics-row">
          <button onClick={() => handleSend('Explain DFA vs NFA')} className="suggest-topic-btn">
            🔀 Explain DFA vs NFA
          </button>
          <button onClick={() => handleSend('Explain Subset Construction')} className="suggest-topic-btn">
            ⚙️ Subset Construction
          </button>
          <button onClick={() => handleSend('Explain DFA Minimization')} className="suggest-topic-btn">
            📐 DFA Minimization
          </button>
        </div>

        {selectedImage && (
          <div style={{
            padding: '10px 16px',
            background: 'var(--bg-hover)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
                background: '#000'
              }}>
                <img
                  src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`}
                  alt="Composer attachment preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedImage.name}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>MIME: {selectedImage.mimeType}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-error)',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Remove Image"
            >
              ✕
            </button>
          </div>
        )}

        {uploadError && (
          <div style={{
            padding: '8px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderTop: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--accent-error)',
            fontSize: '12px',
            fontWeight: 500
          }}>
            ⚠️ {uploadError}
          </div>
        )}

        <form
          className="chat-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputVal);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px' }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept=".png,.jpg,.jpeg,.webp"
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: selectedImage ? 'var(--accent-purple)' : 'var(--bg-hover)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: selectedImage ? '#fff' : 'var(--text-secondary)',
              fontSize: '18px',
              transition: 'all 0.2s ease',
              padding: '0'
            }}
            title="Attach Image (PNG, JPG, WEBP)"
          >
            📎
          </button>
          <input
            type="text"
            className="chat-input-field"
            placeholder={selectedImage ? "Describe this diagram or ask to solve it..." : "Ask a question about state spaces or automata algorithms..."}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button 
            variant="primary" 
            size="sm" 
            type="submit" 
            disabled={!inputVal.trim() && !selectedImage} 
            glow
          >
            Ask Tutor
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AiTutor;
