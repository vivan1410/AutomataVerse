const progressionService = require('../services/progressionService');

const progressionController = {
  register(req, res, next) {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ success: false, error: 'Missing required registration details.' });
      }
      const profile = progressionService.registerUser(username, email, password);
      res.status(201).json({ success: true, profile });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  },

  login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email address is required.' });
      }
      const profile = progressionService.loginUser(email, password || 'guest');
      res.status(200).json({ success: true, profile });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  },

  get(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required.' });
      }
      const profile = progressionService.getProgress(email);
      res.status(200).json({ success: true, profile });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  },

  updateDetails(req, res, next) {
    try {
      const { email, username, avatar } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required.' });
      }
      const profile = progressionService.updateDetails(email, { username, avatar });
      res.status(200).json({ success: true, profile });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  },

  completeLesson(req, res, next) {
    try {
      const { email, lessonId } = req.body;
      if (!email || !lessonId) {
        return res.status(400).json({ success: false, error: 'Email and lessonId are required.' });
      }
      const result = progressionService.completeLesson(email, lessonId);
      res.status(200).json({ success: true, ...result });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  },

  submitQuizAnswer(req, res, next) {
    try {
      const { email, quizId, isCorrect, difficulty } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required.' });
      }
      const result = progressionService.submitQuizAnswer(email, { quizId, isCorrect, difficulty });
      res.status(200).json({ success: true, ...result });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  },

  completeChallenge(req, res, next) {
    try {
      const { email, challengeId, difficulty } = req.body;
      if (!email || !challengeId || !difficulty) {
        return res.status(400).json({ success: false, error: 'Email, challengeId and difficulty are required.' });
      }
      const result = progressionService.completeChallenge(email, { challengeId, difficulty });
      res.status(200).json({ success: true, ...result });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  },

  claimAchievement(req, res, next) {
    try {
      const { email, achievementId, bonusCoins, bonusXp } = req.body;
      if (!email || !achievementId) {
        return res.status(400).json({ success: false, error: 'Email and achievementId are required.' });
      }
      const result = progressionService.claimAchievement(email, { achievementId, bonusCoins, bonusXp });
      res.status(200).json({ success: true, ...result });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  },

  completeModuleBonus(req, res, next) {
    try {
      const { email, moduleId } = req.body;
      if (!email || !moduleId) {
        return res.status(400).json({ success: false, error: 'Email and moduleId are required.' });
      }
      const result = progressionService.completeModuleBonus(email, { moduleId });
      res.status(200).json({ success: true, ...result });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  },

  dailyCheckin(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required.' });
      }
      const profile = progressionService.dailyCheckin(email);
      res.status(200).json({ success: true, profile });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  },

  getLeaderboard(req, res, next) {
    try {
      const leaderboard = progressionService.getLeaderboard();
      res.status(200).json({ success: true, leaderboard });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  },

  async googleLogin(req, res, next) {
    try {
      const { credential } = req.body;
      if (!credential) {
        return res.status(400).json({ success: false, error: 'Missing Google credential token.' });
      }

      // Call Google's tokeninfo API to securely verify the credential token
      const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
      const verifyRes = await fetch(verifyUrl);
      if (!verifyRes.ok) {
        return res.status(400).json({ success: false, error: 'Unable to sign in with Google. Invalid verification response.' });
      }

      const payload = await verifyRes.json();

      // 1. Validate Issuer
      const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
      if (!validIssuers.includes(payload.iss)) {
        return res.status(400).json({ success: false, error: 'Unable to sign in with Google. Invalid issuer.' });
      }

      // 2. Validate Audience / Client ID
      const expectedClientId = process.env.GOOGLE_CLIENT_ID;
      if (payload.aud !== expectedClientId) {
        return res.status(400).json({ success: false, error: 'Unable to sign in with Google. Client ID mismatch.' });
      }

      // 3. Validate Expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && parseInt(payload.exp, 10) < now) {
        return res.status(400).json({ success: false, error: 'Unable to sign in with Google. Token has expired.' });
      }

      // 4. Validate Google Subject
      if (!payload.sub) {
        return res.status(400).json({ success: false, error: 'Unable to sign in with Google. Subject ID is missing.' });
      }

      // Find or create user on backend using validated data
      const profile = progressionService.loginOrRegisterGoogle(
        payload.sub,
        payload.email,
        payload.name,
        payload.picture
      );

      res.status(200).json({ success: true, profile });
    } catch (e) {
      res.status(400).json({ success: false, error: 'Unable to sign in with Google. Please try again.' });
    }
  }
};

module.exports = progressionController;
