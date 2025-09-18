const aiService = require('../services/aiService');
const documentProcessor = require('../services/documentProcessor');
const testCaseGenerator = require('../services/testCaseGenerator');
const csvExporter = require('../utils/csvExporter');
const logger = require('../utils/logger');

const generateTestCases = async (req, res) => {
  try {
    const {
      featureName,
      confluenceContent,
      jiraDescription,
      testTypes,
      testCount,
      groqApiKey
    } = req.body;

    logger.info(`Generating test cases for feature: ${featureName}`);

    // Process uploaded file if exists
    let prfaqContent = '';
    if (req.file) {
      prfaqContent = await documentProcessor.processFile(req.file);
    }

    // Combine all documentation
    const combinedContent = [prfaqContent, confluenceContent, jiraDescription]
      .filter(Boolean)
      .join('\n\n');

    // Generate test cases using AI
    const testCases = await testCaseGenerator.generate({
      featureName,
      content: combinedContent,
      testTypes: JSON.parse(testTypes),
      testCount: parseInt(testCount),
      apiKey: groqApiKey
    });

    // Generate CSV
    const csvData = csvExporter.generateCSV(testCases);

    res.json({
      success: true,
      data: {
        testCases,
        csvData,
        count: testCases.length
      }
    });

    logger.info(`Successfully generated ${testCases.length} test cases`);

  } catch (error) {
    logger.error('Error generating test cases:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const testConnection = async (req, res) => {
  try {
    const { groqApiKey } = req.body;
    const result = await aiService.testConnection(groqApiKey);
    
    res.json({
      success: true,
      message: result
    });

  } catch (error) {
    logger.error('Connection test failed:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  generateTestCases,
  testConnection
};
