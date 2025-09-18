const logger = require('../utils/logger');

class AIService {
  constructor() {
    // Token estimation: roughly 1 token = 4 characters
    this.MAX_TOKENS_PER_REQUEST = 6000; // Leave buffer for response
    this.MAX_INPUT_CHARS = this.MAX_TOKENS_PER_REQUEST * 4;
  }

  // Estimate token count (rough approximation)
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  // Truncate content to fit within token limits
  truncateContent(content, maxTokens = 4000) {
    const maxChars = maxTokens * 4;
    if (content.length <= maxChars) return content;
    
    // Try to truncate at sentence boundaries
    const truncated = content.substring(0, maxChars);
    const lastSentence = truncated.lastIndexOf('.');
    
    return lastSentence > maxChars * 0.7 
      ? truncated.substring(0, lastSentence + 1)
      : truncated + '...';
  }

  // Split content into chunks for processing
  splitContent(content, maxChars = 15000) {
    if (content.length <= maxChars) return [content];
    
    const chunks = [];
    let start = 0;
    
    while (start < content.length) {
      let end = start + maxChars;
      
      // Try to break at paragraph or sentence
      if (end < content.length) {
        const paragraphBreak = content.lastIndexOf('\n\n', end);
        const sentenceBreak = content.lastIndexOf('.', end);
        
        if (paragraphBreak > start + maxChars * 0.5) {
          end = paragraphBreak + 2;
        } else if (sentenceBreak > start + maxChars * 0.7) {
          end = sentenceBreak + 1;
        }
      }
      
      chunks.push(content.substring(start, end));
      start = end;
    }
    
    return chunks;
  }

  async callGroqAPI(apiKey, prompt, maxTokens = 1000) {
    // Check if prompt is too long
    const estimatedTokens = this.estimateTokens(prompt);
    logger.info(`Estimated tokens: ${estimatedTokens}`);
    
    if (estimatedTokens > this.MAX_TOKENS_PER_REQUEST) {
      logger.warn(`Prompt too long (${estimatedTokens} tokens), truncating...`);
      prompt = this.truncateContent(prompt, 4000);
    }

    const response = await fetch(process.env.GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai/gpt-oss-120b',
        temperature: 0.7,
        max_tokens: Math.min(maxTokens, 2000) // Ensure response doesn't exceed limits
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  async testConnection(apiKey) {
    return await this.callGroqAPI(
      apiKey,
      'Hello! Please respond with "API connection successful"',
      50
    );
  }

  // SOLUTION 1: Summarize documents first, then analyze
  async analyzeDocuments(apiKey, featureName, content) {
    // If content is too long, summarize it first
    if (content.length > 10000) {
      logger.info('Content too long, summarizing first...');
      content = await this.summarizeContent(apiKey, content);
    }

    const prompt = `Analyze this feature documentation for "${featureName}":

${content}

Extract key testing information:
1. Main functionality
2. User workflows  
3. Input/output requirements
4. Business rules
5. Integration points
6. Security considerations
7. Edge cases

Keep analysis concise but comprehensive.`;

    return await this.callGroqAPI(apiKey, prompt, 1200);
  }

  // SOLUTION 2: Summarize long content
  async summarizeContent(apiKey, content) {
    const truncatedContent = this.truncateContent(content, 3000);
    
    const prompt = `Summarize this documentation focusing on key features, functionality, and requirements for testing:

${truncatedContent}

Keep the summary detailed enough for test case generation but concise.`;

    return await this.callGroqAPI(apiKey, prompt, 800);
  }

  // SOLUTION 3: Generate fewer test cases per request
  async generateTestCases(apiKey, featureName, analysis, testType, count) {
    // Limit test cases per request to stay within token limits
    const maxTestCasesPerRequest = Math.min(count, 3);
    const allTestCases = [];

    for (let i = 0; i < count; i += maxTestCasesPerRequest) {
      const remainingCount = Math.min(maxTestCasesPerRequest, count - i);
      
      const prompt = `Generate ${remainingCount} ${testType} test cases for "${featureName}":

Analysis: ${this.truncateContent(analysis, 2000)}

Return ONLY a JSON array with these exact fields:
[{
  "id": "TC_${testType.toUpperCase()}_001",
  "summary": "Test case summary",
  "priority": "High|Medium|Low",
  "type": "${testType}",
  "category": "${testType} Testing",
  "preconditions": "Prerequisites",
  "steps": "1. Step one\\n2. Step two\\n3. Step three",
  "expectedResult": "Expected outcome"
}]`;

      try {
        const response = await this.callGroqAPI(apiKey, prompt, 1500);
        const testCases = this.parseTestCases(response, testType, remainingCount, featureName, i + 1);
        allTestCases.push(...testCases);
        
        // Add small delay between requests to avoid rate limiting
        if (i + maxTestCasesPerRequest < count) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        logger.warn(`Failed to generate ${testType} batch ${i + 1}, using fallback`);
        const fallbackCases = this.generateFallbackTestCases(testType, remainingCount, featureName, i + 1);
        allTestCases.push(...fallbackCases);
      }
    }

    return allTestCases;
  }

  parseTestCases(response, testType, count, featureName, startIndex = 1) {
    try {
      // Try to extract JSON array from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed.map((tc, index) => ({
            ...tc,
            id: tc.id || `TC_${testType.toUpperCase()}_${String(startIndex + index).padStart(3, '0')}`
          }));
        }
      }
      throw new Error('No valid JSON array found');
    } catch (error) {
      logger.warn('Failed to parse AI response, using fallback');
      return this.generateFallbackTestCases(testType, count, featureName, startIndex);
    }
  }

  generateFallbackTestCases(testType, count, featureName, startIndex = 1) {
    const testCases = [];
    for (let i = 0; i < count; i++) {
      const tcNumber = startIndex + i;
      testCases.push({
        id: `TC_${testType.toUpperCase()}_${String(tcNumber).padStart(3, '0')}`,
        summary: `Verify ${featureName} ${testType.toLowerCase()} functionality - Scenario ${tcNumber}`,
        priority: i < 2 ? 'High' : 'Medium',
        type: testType,
        category: `${testType} Testing`,
        preconditions: `System is ready and ${featureName} is accessible`,
        steps: `1. Access ${featureName}\n2. Perform ${testType.toLowerCase()} test scenario ${tcNumber}\n3. Verify expected behavior\n4. Document results`,
        expectedResult: `${featureName} behaves correctly for ${testType.toLowerCase()} scenario ${tcNumber}`
      });
    }
    return testCases;
  }

  // SOLUTION 4: Alternative - Use completely offline generation
  generateOfflineTestCases(featureName, testType, count) {
    logger.info('Generating test cases offline (no API calls)');
    
    const templates = {
      'Functional': [
        'Verify core functionality works as expected',
        'Validate user can complete primary workflow',
        'Test feature with valid input data',
        'Confirm expected outputs are generated'
      ],
      'UI/UX': [
        'Verify user interface elements are displayed correctly',
        'Test navigation and user flow',
        'Validate responsive design on different screen sizes',
        'Check accessibility compliance'
      ],
      'Negative': [
        'Test with invalid input data',
        'Verify error handling for edge cases',
        'Test system behavior under stress',
        'Validate security boundaries'
      ],
      'Boundary': [
        'Test with minimum acceptable values',
        'Test with maximum acceptable values',
        'Test with values just outside acceptable range',
        'Verify boundary condition handling'
      ]
    };

    const testCases = [];
    const scenarios = templates[testType] || templates['Functional'];
    
    for (let i = 1; i <= count; i++) {
      const scenario = scenarios[(i - 1) % scenarios.length];
      testCases.push({
        id: `TC_${testType.toUpperCase()}_${String(i).padStart(3, '0')}`,
        summary: `${scenario} for ${featureName}`,
        priority: i <= 2 ? 'High' : i <= 4 ? 'Medium' : 'Low',
        type: testType,
        category: `${testType} Testing`,
        preconditions: `${featureName} system is accessible and user has appropriate permissions`,
        steps: `1. Navigate to ${featureName}\n2. ${scenario.toLowerCase()}\n3. Observe system behavior\n4. Verify results match expectations`,
        expectedResult: `${featureName} should handle the ${testType.toLowerCase()} scenario correctly without errors`
      });
    }
    
    return testCases;
  }
}

module.exports = new AIService();