const aiService = require('./aiService');
const logger = require('../utils/logger');

class TestCaseGenerator {
  async generate({ featureName, content, testTypes, testCount, apiKey }) {
    try {
      logger.info('Starting test case generation...');
      
      // Check if we should use offline mode (fallback)
      const useOfflineMode = process.env.USE_OFFLINE_MODE === 'true' || !apiKey;
      
      if (useOfflineMode) {
        logger.info('Using offline test case generation');
        return this.generateOffline(featureName, testTypes, testCount);
      }

      // SOLUTION 1: Check content size and adjust strategy
      const contentLength = content.length;
      logger.info(`Content length: ${contentLength} characters`);
      
      let analysis = '';
      
      if (contentLength > 20000) {
        // For very large content, generate basic test cases without AI analysis
        logger.info('Content too large, using template-based generation with AI enhancement');
        analysis = `Feature: ${featureName}\nContent: Large documentation provided`;
      } else if (contentLength > 10000) {
        // For medium content, summarize first
        logger.info('Summarizing content before analysis...');
        const summary = await aiService.summarizeContent(apiKey, content);
        analysis = await aiService.analyzeDocuments(apiKey, featureName, summary);
      } else {
        // For small content, analyze directly
        analysis = await aiService.analyzeDocuments(apiKey, featureName, content);
      }

      const allTestCases = [];
      
      // SOLUTION 2: Generate test cases in smaller batches
      for (const testType of testTypes) {
        logger.info(`Generating ${testType} test cases...`);
        
        try {
          // Limit test cases per type to avoid token limits
          const adjustedCount = Math.min(testCount, 5);
          
          const testCases = await aiService.generateTestCases(
            apiKey, featureName, analysis, testType, adjustedCount
          );
          
          allTestCases.push(...testCases);
          
          // Add delay between different test types
          if (testTypes.indexOf(testType) < testTypes.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (error) {
          logger.warn(`AI generation failed for ${testType}, using enhanced templates`);
          
          // SOLUTION 3: Smart fallback with feature context
          const fallbackCases = this.generateEnhancedFallback(
            featureName, testType, testCount, content
          );
          allTestCases.push(...fallbackCases);
        }
      }

      logger.info(`Successfully generated ${allTestCases.length} test cases`);
      return allTestCases;
      
    } catch (error) {
      logger.error('Test case generation failed completely, using offline mode:', error);
      return this.generateOffline(featureName, testTypes, testCount);
    }
  }

  // SOLUTION 4: Enhanced offline generation with content analysis
  generateOffline(featureName, testTypes, testCount) {
    logger.info('Generating test cases offline');
    const allTestCases = [];
    
    for (const testType of testTypes) {
      const testCases = aiService.generateOfflineTestCases(featureName, testType, testCount);
      allTestCases.push(...testCases);
    }
    
    return allTestCases;
  }

  // SOLUTION 5: Enhanced fallback with basic content understanding
  generateEnhancedFallback(featureName, testType, count, content) {
    logger.info(`Generating enhanced fallback for ${testType}`);
    
    // Extract some basic info from content for better test cases
    const keywords = this.extractKeywords(content);
    const hasLogin = /login|signin|authenticate|password/i.test(content);
    const hasForm = /form|input|submit|validation/i.test(content);
    const hasAPI = /api|endpoint|service|integration/i.test(content);
    const hasDatabase = /database|data|store|save|retrieve/i.test(content);
    
    const testCases = [];
    
    for (let i = 1; i <= count; i++) {
      const testCase = this.generateContextualTestCase(
        featureName, testType, i, {
          hasLogin, hasForm, hasAPI, hasDatabase, keywords
        }
      );
      testCases.push(testCase);
    }
    
    return testCases;
  }

  extractKeywords(content) {
    if (!content) return [];
    
    // Simple keyword extraction
    const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const frequency = {};
    
    words.forEach(word => {
      if (!['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'were'].includes(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });
    
    return Object.keys(frequency)
      .sort((a, b) => frequency[b] - frequency[a])
      .slice(0, 5);
  }

  generateContextualTestCase(featureName, testType, index, context) {
    const { hasLogin, hasForm, hasAPI, hasDatabase, keywords } = context;
    const keywordText = keywords.length > 0 ? ` involving ${keywords.slice(0, 2).join(' and ')}` : '';
    
    let summary, steps, expectedResult;
    
    switch (testType) {
      case 'Functional':
        summary = `Verify ${featureName} core functionality${keywordText} - Scenario ${index}`;
        steps = this.generateFunctionalSteps(featureName, context, index);
        expectedResult = `${featureName} should perform the expected functionality correctly`;
        break;
        
      case 'UI/UX':
        summary = `Verify ${featureName} user interface and experience${keywordText} - Scenario ${index}`;
        steps = this.generateUISteps(featureName, context, index);
        expectedResult = `UI should be user-friendly and responsive with proper visual feedback`;
        break;
        
      case 'Negative':
        summary = `Test ${featureName} error handling${keywordText} - Scenario ${index}`;
        steps = this.generateNegativeSteps(featureName, context, index);
        expectedResult = `System should handle errors gracefully with appropriate error messages`;
        break;
        
      case 'Security':
        summary = `Verify ${featureName} security measures${keywordText} - Scenario ${index}`;
        steps = this.generateSecuritySteps(featureName, context, index);
        expectedResult = `Security measures should prevent unauthorized access and protect data`;
        break;
        
      default:
        summary = `Test ${featureName} ${testType.toLowerCase()} scenario ${index}`;
        steps = `1. Access ${featureName}\n2. Perform ${testType.toLowerCase()} test\n3. Verify results`;
        expectedResult = `${featureName} should handle ${testType.toLowerCase()} scenario correctly`;
    }
    
    return {
      id: `TC_${testType.toUpperCase()}_${String(index).padStart(3, '0')}`,
      summary,
      priority: index <= 2 ? 'High' : index <= 4 ? 'Medium' : 'Low',
      type: testType,
      category: `${testType} Testing`,
      preconditions: `${featureName} is accessible and user has appropriate permissions${hasLogin ? ' and valid credentials' : ''}`,
      steps,
      expectedResult
    };
  }

  generateFunctionalSteps(featureName, context, index) {
    const steps = [`1. Navigate to ${featureName}`];
    
    if (context.hasLogin && index === 1) {
      steps.push('2. Log in with valid credentials');
      steps.push(`3. Access main ${featureName} functionality`);
      steps.push('4. Perform primary user workflow');
    } else if (context.hasForm) {
      steps.push('2. Fill in required form fields with valid data');
      steps.push('3. Submit the form');
      steps.push('4. Verify successful submission');
    } else if (context.hasAPI) {
      steps.push('2. Trigger API call through the interface');
      steps.push('3. Verify API response is processed correctly');
      steps.push('4. Check that results are displayed properly');
    } else {
      steps.push(`2. Perform primary ${featureName} action`);
      steps.push('3. Verify expected behavior occurs');
      steps.push('4. Check that results are accurate');
    }
    
    return steps.join('\n');
  }

  generateUISteps(featureName, context, index) {
    const steps = [`1. Open ${featureName} in browser`];
    
    switch (index) {
      case 1:
        steps.push('2. Verify all UI elements are displayed correctly');
        steps.push('3. Check layout and alignment');
        steps.push('4. Test navigation elements');
        break;
      case 2:
        steps.push('2. Test responsive design on different screen sizes');
        steps.push('3. Verify mobile compatibility');
        steps.push('4. Check touch interactions work properly');
        break;
      default:
        steps.push('2. Test user interaction flows');
        steps.push('3. Verify visual feedback for actions');
        steps.push('4. Check accessibility features');
    }
    
    return steps.join('\n');
  }

  generateNegativeSteps(featureName, context, index) {
    const steps = [`1. Access ${featureName}`];
    
    if (context.hasForm) {
      steps.push('2. Enter invalid data in form fields');
      steps.push('3. Attempt to submit the form');
      steps.push('4. Verify appropriate error messages are shown');
    } else if (context.hasLogin) {
      steps.push('2. Attempt login with invalid credentials');
      steps.push('3. Try accessing protected features without authentication');
      steps.push('4. Verify access is properly denied');
    } else {
      steps.push('2. Provide invalid or malformed input');
      steps.push('3. Attempt unauthorized actions');
      steps.push('4. Verify system handles errors gracefully');
    }
    
    return steps.join('\n');
  }

  generateSecuritySteps(featureName, context, index) {
    const steps = [`1. Access ${featureName}`];
    
    if (context.hasLogin) {
      steps.push('2. Test password requirements and validation');
      steps.push('3. Verify session management');
      steps.push('4. Check for proper logout functionality');
    } else if (context.hasAPI) {
      steps.push('2. Test API authentication and authorization');
      steps.push('3. Verify input sanitization');
      steps.push('4. Check for proper error handling without data exposure');
    } else {
      steps.push('2. Test input validation and sanitization');
      steps.push('3. Verify data protection measures');
      steps.push('4. Check for security vulnerabilities');
    }
    
    return steps.join('\n');
  }
}

module.exports = new TestCaseGenerator();