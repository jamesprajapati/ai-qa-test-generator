const aiService = require('./aiService');
const logger = require('../utils/logger');

class TestCaseGenerator {
  async generate({ featureName, content, testTypes, testCount, apiKey }) {
    try {
      logger.info('Analyzing documentation...');
      const analysis = await aiService.analyzeDocuments(apiKey, featureName, content);

      const allTestCases = [];
      
      for (const testType of testTypes) {
        logger.info(`Generating ${testType} test cases...`);
        
        try {
          const testCases = await aiService.generateTestCases(
            apiKey, featureName, analysis, testType, testCount
          );
          allTestCases.push(...testCases);
        } catch (error) {
          logger.warn(`Failed to generate ${testType} tests, using fallback`);
          const fallbackCases = aiService.generateFallbackTestCases(testType, testCount, featureName);
          allTestCases.push(...fallbackCases);
        }
      }

      return allTestCases;
    } catch (error) {
      logger.error('Test case generation failed:', error);
      throw error;
    }
  }
}

module.exports = new TestCaseGenerator();
