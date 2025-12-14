// server/middlewares/validateMiddleware.js
const validate = (schema) => (req, res, next) => {
  try {
    // If no schema provided, skip validation
    if (!schema || typeof schema.safeParse !== 'function') {
      return next();
    }

    // Defensive: if body is Buffer (webhook raw), skip validation here
    if (Buffer.isBuffer(req.body)) {
      console.warn('validateMiddleware: req.body is a Buffer — skipping schema validation (likely a webhook/raw body).');
      return next();
    }

    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstError = result.error.issues?.[0] ?? { message: 'Invalid input', path: [] };
      return res.status(400).json({
        message: firstError.message || 'Invalid input',
        path: firstError.path,
      });
    }

    // replace body with parsed, safe data
    req.body = result.data;
    return next();
  } catch (err) {
    console.error('Validation middleware unexpected error:', err);
    // pass error to global error handler
    return next(err);
  }
};

module.exports = validate;
