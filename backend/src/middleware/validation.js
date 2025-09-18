const joi = require('joi');

const validateConnectionTest = (req, res, next) => {
  const schema = joi.object({
    groqApiKey: joi.string().required().pattern(/^gsk_/)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  next();
};

const validateTestCaseRequest = (req, res, next) => {
  const schema = joi.object({
    featureName: joi.string().required().min(1).max(100),
    confluenceContent: joi.string().allow(''),
    jiraDescription: joi.string().allow(''),
    testTypes: joi.string().required(),
    testCount: joi.number().integer().min(1).max(20),
    groqApiKey: joi.string().required().pattern(/^gsk_/)
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  next();
};

module.exports = {
  validateConnectionTest,
  validateTestCaseRequest
};
