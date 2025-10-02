const validateAsync = schemaFunction => async (req, res, next) => {
  try {
    const schema = await schemaFunction(); // Retrieve schema dynamically
    await schema.validateAsync(req.body, { abortEarly: false }); // Validate request body
    next(); // Proceed if validation is successful
  } catch (error) {
    const errorMessage = error.details?.map(err => err.message).join(', ') || 'Validation failed';
    console.error('Validation Error:', error);
    return res.status(400).json({ message: errorMessage });
  }
};

module.exports = validateAsync;
