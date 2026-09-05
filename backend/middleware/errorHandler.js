/**
 * Centralized Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Backend Error]:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Handle specific Gemini API errors if helpful
  const is401 = err.status === 401 || 
                (err.message && err.message.includes('401')) ||
                (err.message && err.message.toLowerCase().includes('api_key_invalid')) ||
                (err.message && err.message.toLowerCase().includes('api key'));
                
  const is429 = err.status === 429 || 
                (err.message && err.message.toLowerCase().includes('rate limit')) || 
                (err.message && err.message.toLowerCase().includes('quota')) ||
                (err.message && err.message.toLowerCase().includes('billing')) ||
                (err.message && err.message.toLowerCase().includes('exhausted'));

  if (is401) {
    return res.status(401).json({
      success: false,
      error: 'Invalid Gemini API key.',
    });
  }

  if (is429) {
    return res.status(429).json({
      success: false,
      error: 'Gemini API quota exceeded.',
    });
  }

  res.status(statusCode).json({
    success: false,
    error: 'An unexpected server error occurred.',
  });
};

module.exports = errorHandler;
