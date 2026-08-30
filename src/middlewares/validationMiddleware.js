const formatZodError = (error) => {
  const errorMessages = (error.issues || []).map((err) => err.message);
  return `Validation Error: ${errorMessages.join(', ')}`;
};

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    res.status(400);
    throw new Error(formatZodError(error));
  }
};

const validateQuery = (schema) => (req, res, next) => {
  try {
    req.query = schema.parse(req.query);
    next();
  } catch (error) {
    res.status(400);
    throw new Error(formatZodError(error));
  }
};

module.exports = { validate, validateQuery };
