const express = require('express');
const router = express.Router();
const geminiController = require('../controllers/geminiController');
const progressionController = require('../controllers/progressionController');

/**
 * Health Check Endpoint
 * GET /api/health
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "AutomataVerse Backend Running"
  });
});

/**
 * API Root Information Endpoint
 * GET /api
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "AutomataVerse API is online and operational.",
    endpoints: {
      health: "/api/health",
      explain: "/api/explain (POST)",
      auth: {
        register: "/api/auth/register (POST)",
        login: "/api/auth/login (POST)",
        google: "/api/auth/google (POST)"
      },
      progress: {
        get: "/api/progress/get (POST)",
        updateDetails: "/api/progress/update-details (POST)",
        completeLesson: "/api/progress/complete-lesson (POST)",
        submitQuizAnswer: "/api/progress/submit-quiz-answer (POST)",
        completeChallenge: "/api/progress/complete-challenge (POST)",
        claimAchievement: "/api/progress/claim-achievement (POST)",
        completeModuleBonus: "/api/progress/complete-module-bonus (POST)",
        dailyCheckin: "/api/progress/daily-checkin (POST)",
        leaderboard: "/api/progress/leaderboard (GET)"
      }
    }
  });
});

/**
 * Explain automata concept
 * POST /api/explain
 */
router.post('/explain', geminiController.explain);

/**
 * Auth & Progression Endpoints
 */
router.post('/auth/register', progressionController.register);
router.post('/auth/login', progressionController.login);
router.post('/auth/google', progressionController.googleLogin);
router.post('/progress/get', progressionController.get);
router.post('/progress/update-details', progressionController.updateDetails);
router.post('/progress/complete-lesson', progressionController.completeLesson);
router.post('/progress/submit-quiz-answer', progressionController.submitQuizAnswer);
router.post('/progress/complete-challenge', progressionController.completeChallenge);
router.post('/progress/claim-achievement', progressionController.claimAchievement);
router.post('/progress/complete-module-bonus', progressionController.completeModuleBonus);
router.post('/progress/daily-checkin', progressionController.dailyCheckin);
router.get('/progress/leaderboard', progressionController.getLeaderboard);

module.exports = router;
