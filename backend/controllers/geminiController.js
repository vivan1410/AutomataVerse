const geminiService = require('../services/geminiService');

/**
 * Controller to handle Gemini API HTTP requests
 */
const geminiController = {
  /**
   * Explain FSM concepts
   */
  async explain(req, res, next) {
    try {
      const { question, image } = req.body;
      if ((!question || typeof question !== 'string') && !image) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request: "question" string or "image" object is required in the body.',
        });
      }

      console.log(`[Backend API] /explain request: "${question || '(image only)'}"`);
      const answer = await geminiService.explainConcept(question || '', image);

      res.status(200).json({
        success: true,
        answer: answer,
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = geminiController;
