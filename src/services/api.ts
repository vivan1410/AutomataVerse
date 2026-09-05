const getApiBaseUrl = (): string => {
  const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  let cleaned = rawUrl.trim().replace(/\/+$/, '');
  if (!cleaned.endsWith('/api')) {
    cleaned = `${cleaned}/api`;
  }
  return cleaned;
};

export const API_BASE_URL = getApiBaseUrl();

export interface ExplanationResponse {
  success: boolean;
  answer: string;
  error?: string;
}

export interface TransitionTableRow {
  from: string;
  to: string;
  symbol: string;
}

export interface GenerationResponse {
  success: boolean;
  states: string[];
  startState: string;
  finalStates: string[];
  transitionTable: TransitionTableRow[];
  explanation: string;
  error?: string;
}

export interface EvaluationResponse {
  success: boolean;
  correct: boolean;
  feedback: string;
  mistakes: string[];
  suggestions: string[];
  error?: string;
}

/**
 * Common fetch helper to avoid duplication
 */
async function postRequest<T>(endpoint: string, body: object): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }

    return await response.json() as T;
  } catch (error: any) {
    console.error(`[API Client Error] Request to ${endpoint} failed:`, error);
    throw error;
  }
}

export const apiService = {
  /**
   * Health check connection test
   */
  checkHealth: async (): Promise<{ success: boolean; message: string }> => {
    const url = `${API_BASE_URL}/health`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Health check returned status ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('[API Health Check Error] Server is unreachable:', error);
      throw error;
    }
  },

  /**
   * Explain FSM theory questions
   */
  explainConcept: async (question: string, image?: { data: string; mimeType: string }): Promise<ExplanationResponse> => {
    return postRequest<ExplanationResponse>('/explain', { question, image });
  },

  /**
   * Synthesize new DFA or NFA diagrams from verbal descriptions
   */
  generateAutomaton: async (type: 'DFA' | 'NFA', language: string): Promise<GenerationResponse> => {
    return postRequest<GenerationResponse>('/generate', { type, language });
  },

  /**
   * Evaluate correctness of student FSM configurations
   */
  evaluateAutomaton: async (
    type: 'DFA' | 'NFA',
    question: string,
    studentAutomaton: any
  ): Promise<EvaluationResponse> => {
    return postRequest<EvaluationResponse>('/evaluate', { type, question, studentAutomaton });
  },

  // --- Auth & Progression Endpoints ---
  register: async (username: string, email: string, password?: string): Promise<any> => {
    return postRequest<any>('/auth/register', { username, email, password: password || 'guest' });
  },
  login: async (email: string, password?: string): Promise<any> => {
    return postRequest<any>('/auth/login', { email, password: password || 'guest' });
  },
  googleLogin: async (credential: string): Promise<any> => {
    return postRequest<any>('/auth/google', { credential });
  },
  getProgress: async (email: string): Promise<any> => {
    return postRequest<any>('/progress/get', { email });
  },
  updateDetails: async (email: string, username?: string, avatar?: string): Promise<any> => {
    return postRequest<any>('/progress/update-details', { email, username, avatar });
  },
  completeLesson: async (email: string, lessonId: string): Promise<any> => {
    return postRequest<any>('/progress/complete-lesson', { email, lessonId });
  },
  submitQuizAnswer: async (email: string, quizId: string, isCorrect: boolean, difficulty: string): Promise<any> => {
    return postRequest<any>('/progress/submit-quiz-answer', { email, quizId, isCorrect, difficulty });
  },
  completeChallenge: async (email: string, challengeId: string, difficulty: string): Promise<any> => {
    return postRequest<any>('/progress/complete-challenge', { email, challengeId, difficulty });
  },
  claimAchievement: async (email: string, achievementId: string, bonusCoins: number, bonusXp: number): Promise<any> => {
    return postRequest<any>('/progress/claim-achievement', { email, achievementId, bonusCoins, bonusXp });
  },
  completeModuleBonus: async (email: string, moduleId: string): Promise<any> => {
    return postRequest<any>('/progress/complete-module-bonus', { email, moduleId });
  },
  dailyCheckin: async (email: string): Promise<any> => {
    return postRequest<any>('/progress/daily-checkin', { email });
  },
  getLeaderboard: async (): Promise<any> => {
    const url = `${API_BASE_URL}/progress/leaderboard`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Leaderboard fetch returned status ${response.status}`);
    }
    return await response.json();
  }
};
