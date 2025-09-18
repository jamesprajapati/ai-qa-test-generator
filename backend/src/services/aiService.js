const logger = require('../utils/logger');

class AIService {
  async callGroqAPI(apiKey, prompt, maxTokens = 1000) {
    const response = await fetch(process.env.GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-70b-versatile',
        temperature: 0.7,
        max_tokens: maxTokens
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
      'Hello! Please respond with "Groq API connection successful"',
      50
    );
  }

  async analyzeDocuments(apiKey, featureName, content) {
    const prompt = `Analyze the following feature documentation for "${featureName}":

${content}

Extract key information for test case generation:
1. Main functionality
2. User workflows
3. Input/output requirements
4. Business rules
5. Integration points
6. Security considerations
7. Edge cases

Provide a structured analysis.`;

    return await this.callGroqAPI(apiKey, prompt, 1500);
  }

  async generateTestCases(apiKey, featureName, analysis, testType, count) {
    const prompt = `Generate ${count} ${testType} test cases for "${featureName}":

${analysis}

Format as JSON array with fields: id, summary, priority, type, category, preconditions, steps, expectedResult.`;

    const response = await this.callGroqAPI(apiKey, prompt, 2000);
    
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found');
    } catch {
      return this.generateFallbackTestCases(testType, count, featureName);
    }
  }

  generateFallbackTestCases(testType, count, featureName) {
    const testCases = [];
    for (let i = 1; i <= count; i++) {
      testCases.push({
        id: `TC_${testType.toUpperCase()}_${i.toString().padStart(3, '0')}`,
        summary: `Verify ${featureName} ${testType.toLowerCase()} functionality - Scenario ${i}`,
        priority: i <= 2 ? 'High' : 'Medium',
        type: testType,
        category: `${testType} Testing`,
        preconditions: `System is ready and ${featureName} is accessible`,
        steps: `1. Access ${featureName}\n2. Perform ${testType.toLowerCase()} test\n3. Verify results`,
        expectedResult: `${featureName} behaves correctly for ${testType.toLowerCase()} scenario`
      });
    }
    return testCases;
  }
}

module.exports = new AIService();
