const { validationResult } = require('express-validator');

/**
 * Middleware to check express-validator results.
 * If errors exist, sends 400 with error messages.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Collect error messages into a flat array
    const messages = errors.array().map((err) => err.msg);
    return res.status(400).json({
      message: 'Validation failed',
      errors: messages,
    });
  }

  next();
};

module.exports = validate;
