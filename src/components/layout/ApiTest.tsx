import React, { useState } from 'react';
import './ApiTest.css';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { apiService, API_BASE_URL } from '../../services/api';

export const ApiTest: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const result = await apiService.explainConcept(question);
      if (result.success) {
        setResponse(result.answer);
      } else {
        setError(result.error || 'Server returned an unsuccessful response status.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error: Failed to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-test-view av-tab-transition">
      <Card glass className="api-test-card">
        <div className="api-test-header">
          <span className="dev-badge">🛠️ DEVELOPMENT TOOLS</span>
          <h2 className="api-test-title">AI API Diagnostic Console</h2>
          <p className="api-test-subtitle">Use this console to test explain completions directly against the Node.js Express server.</p>
        </div>

        <form onSubmit={handleSend} className="api-test-form">
          <div className="input-group">
            <label htmlFor="question-input" className="input-label">Question</label>
            <input
              id="question-input"
              type="text"
              className="question-input-field"
              placeholder="e.g., What is a Deterministic Finite Automaton (DFA)?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button variant="primary" size="md" type="submit" disabled={loading || !question.trim()} glow>
              {loading ? 'Querying API...' : 'Send Request'}
            </Button>
          </div>
        </form>

        {/* Diagnostics & Responses Panel */}
        <div className="response-panel-wrapper">
          <h4 className="panel-title">Response Panel</h4>
          
          {loading && (
            <div className="panel-loading-state">
              <span className="loading-spinner"></span>
              <p className="loading-text">Contacting backend service at {API_BASE_URL}/explain...</p>
            </div>
          )}

          {error && (
            <div className="panel-error-state">
              <span className="error-icon">⚠️</span>
              <div className="error-info">
                <span className="error-title">Request Failed</span>
                <p className="error-text">{error}</p>
              </div>
            </div>
          )}

          {response && (
            <div className="panel-success-state">
              <h5 className="response-title">AI Response:</h5>
              <div className="response-text-content">
                {response.split('\n').map((line, idx) => (
                  <p key={idx} className="response-para">{line}</p>
                ))}
              </div>
            </div>
          )}

          {!loading && !error && !response && (
            <div className="panel-empty-state">
              <p>Console idle. Type a question and click Send to run diagnostics.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ApiTest;
