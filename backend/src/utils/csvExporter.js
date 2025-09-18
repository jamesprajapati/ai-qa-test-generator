class CSVExporter {
  // Generate Xray-compatible CSV matching your exact template format
 // JUST REPLACE THE generateXrayCSV function in your csvExporter.js file

generateXrayCSV(testCases) {
  // Exact headers from your template - Test ID,Summary,Description,Test Type,Step,Data,Expected Result,Repository
  const headers = [
    'Test ID',
    'Summary', 
    'Description',
    'Test Type',
    'Step',
    'Data',
    'Expected Result',
    'Repository'
  ];

  let csvContent = headers.map(h => `"${h}"`).join(',') + '\n';

  testCases.forEach((testCase, testIndex) => {
    // Parse steps - each step becomes a separate row
    const steps = (testCase.steps || '').split('\n').filter(step => step.trim());
    
    if (steps.length === 0) {
      // No steps - create single row
      csvContent += [
        `"${testIndex + 1}"`,                                    // Test ID
        `"${testCase.summary || 'Test case'}"`,                  // Summary
        `"${testCase.preconditions || 'Test description'}"`,     // Description
        `"Manual"`,                                              // Test Type
        `"Execute test"`,                                        // Step
        `""`,                                                    // Data
        `"${testCase.expectedResult || 'Test passes'}"`,         // Expected Result
        `"${testCase.category || 'General'}"`                    // Repository
      ].join(',') + '\n';
    } else {
      // Multiple steps - one row per step
      steps.forEach((step, stepIndex) => {
        const cleanStep = step.replace(/^\d+\.\s*/, '').trim(); // Remove "1. 2. 3." numbering
        
        csvContent += [
          `"${testIndex + 1}"`,                                                           // Test ID (same for all steps)
          stepIndex === 0 ? `"${testCase.summary || 'Test case'}"` : '""',              // Summary (only first row)
          stepIndex === 0 ? `"${testCase.preconditions || 'Test description'}"` : '""', // Description (only first row)  
          stepIndex === 0 ? `"Manual"` : '""',                                          // Test Type (only first row)
          `"${cleanStep}"`,                                                             // Step
          `""`,                                                                         // Data (empty)
          `"${testCase.expectedResult || 'Step completes'}"`,                           // Expected Result
          stepIndex === 0 ? `"${testCase.category || 'General'}"` : '""'               // Repository (only first row)
        ].join(',') + '\n';
      });
    }
  });

  return csvContent;
}

  // LEGACY METHOD - Generate original Xray CSV (for backward compatibility)
  generateXrayCSVLegacy(testCases) {
    // Original Xray headers (keeping this for compatibility)
    const headers = [
      'Test Key',
      'Test Summary',
      'Test Type',
      'Test Priority',
      'Component',
      'Labels',
      'Test Repository Path',
      'Precondition',
      'Test Script (Step-by-Step)',
      'Expected Result',
      'Test Data',
      'Test Environment',
      'Test Execution Type',
      'Status'
    ];

    let csvContent = this.escapeCSVRow(headers).join(',') + '\n';

    testCases.forEach((testCase, index) => {
      const row = [
        testCase.id || `TC-${String(index + 1).padStart(4, '0')}`,
        testCase.summary || 'Test case summary',
        'Manual',
        testCase.priority || 'Medium',
        testCase.category || 'General',
        `manual,ai-generated,${testCase.type?.toLowerCase() || 'functional'}`,
        `/${testCase.category?.replace(/\s+/g, '_') || 'General'}/${testCase.type?.replace(/\s+/g, '_') || 'Functional'}`,
        testCase.preconditions || 'System is ready',
        this.formatTestSteps(testCase.steps),
        testCase.expectedResult || 'Expected behavior occurs',
        '',
        'Test Environment',
        'Manual',
        'Draft'
      ];
      
      csvContent += this.escapeCSVRow(row).join(',') + '\n';
    });

    return csvContent;
  }

  // Parse steps into individual step objects for Xray template format
  parseStepsForXray(steps) {
    if (!steps || typeof steps !== 'string') return [];
    
    const stepLines = steps.split('\n').filter(line => line.trim());
    const parsedSteps = [];
    
    stepLines.forEach(line => {
      // Remove numbering (1. 2. etc.) and clean up
      const cleanStep = line.replace(/^\d+\.\s*/, '').trim();
      if (cleanStep) {
        parsedSteps.push({
          action: cleanStep,
          data: '', // Can be enhanced based on step content
          expectedResult: 'Step completes successfully'
        });
      }
    });
    
    return parsedSteps;
  }

  // Generate description from test case info for Xray template
  generateDescription(testCase) {
    let description = '';
    
    if (testCase.preconditions) {
      description += `Preconditions: ${testCase.preconditions}`;
    }
    
    if (testCase.category && testCase.type) {
      if (description) description += '\n\n';
      description += `Category: ${testCase.category}\nType: ${testCase.type}`;
    }
    
    return description || 'Test case description';
  }

  // Generate repository path for Xray template
  generateRepository(testCase) {
    const category = testCase.category?.replace(/\s+/g, '_') || 'General';
    const type = testCase.type?.replace(/\s+/g, '_') || 'Manual';
    return `${category}/${type}`;
  }

  // Generate simplified CSV for basic imports
  generateSimpleCSV(testCases) {
    const headers = [
      'ID', 'Summary', 'Priority', 'Type', 'Category',
      'Preconditions', 'Steps', 'Expected Result', 'Labels'
    ];

    let csvContent = this.escapeCSVRow(headers).join(',') + '\n';

    testCases.forEach(testCase => {
      const row = [
        testCase.id,
        testCase.summary,
        testCase.priority,
        testCase.type,
        testCase.category,
        testCase.preconditions,
        testCase.steps.replace(/\n/g, '\\n'),
        testCase.expectedResult,
        'manual,ai-generated'
      ];
      csvContent += this.escapeCSVRow(row).join(',') + '\n';
    });

    return csvContent;
  }

  // Generate TestRail-compatible CSV
  generateTestRailCSV(testCases) {
    const headers = [
      'ID', 'Title', 'Section', 'Template', 'Type', 'Priority',
      'Estimate', 'References', 'Automation Type', 'Preconditions',
      'Steps', 'Expected Result'
    ];

    let csvContent = this.escapeCSVRow(headers).join(',') + '\n';

    testCases.forEach(testCase => {
      const row = [
        testCase.id,
        testCase.summary,
        testCase.category,
        'Test Case (Steps)',
        testCase.type,
        this.mapPriorityToTestRail(testCase.priority),
        '30m',
        '',
        'None',
        testCase.preconditions,
        testCase.steps.replace(/\n/g, '\\n'),
        testCase.expectedResult
      ];
      
      csvContent += this.escapeCSVRow(row).join(',') + '\n';
    });

    return csvContent;
  }

  // Generate Azure DevOps CSV
  generateAzureDevOpsCSV(testCases) {
    const headers = [
      'ID', 'Work Item Type', 'Title', 'Description', 'State', 'Priority',
      'Area Path', 'Iteration Path', 'Tags', 'Test Steps', 'Expected Result'
    ];

    let csvContent = this.escapeCSVRow(headers).join(',') + '\n';

    testCases.forEach(testCase => {
      const row = [
        testCase.id,
        'Test Case',
        testCase.summary,
        `${testCase.preconditions}\n\n${testCase.steps}`,
        'Design',
        this.mapPriorityToAzure(testCase.priority),
        testCase.category,
        'Sprint 1',
        `manual; ai-generated; ${testCase.type.toLowerCase()}`,
        testCase.steps.replace(/\n/g, '\\n'),
        testCase.expectedResult
      ];
      
      csvContent += this.escapeCSVRow(row).join(',') + '\n';
    });

    return csvContent;
  }

  // Generate comprehensive export package
 // In your csvExporter.js - Update the generateExportPackage function

generateExportPackage(testCases, featureName) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const baseFilename = `${featureName.replace(/\s+/g, '_')}_${timestamp}`;

  return {
    xray: {
      filename: `${baseFilename}_xray.csv`,  // MAKE SURE IT'S .csv NOT .xray
      content: this.generateXrayCSV(testCases),
      description: 'Xray Test Management CSV format (matches your template)'
    },
    simple: {
      filename: `${baseFilename}_simple.csv`,
      content: this.generateSimpleCSV(testCases),
      description: 'Simple CSV format for basic imports'
    },
    testrail: {
      filename: `${baseFilename}_testrail.csv`,
      content: this.generateTestRailCSV(testCases),
      description: 'TestRail compatible format'
    },
    azure: {
      filename: `${baseFilename}_azure.csv`,
      content: this.generateAzureDevOpsCSV(testCases),
      description: 'Azure DevOps compatible format'
    },
    json: {
      filename: `${baseFilename}_data.json`,
      content: JSON.stringify(testCases, null, 2),
      description: 'JSON format for custom integrations'
    },
    summary: {
      filename: `${baseFilename}_summary.txt`,
      content: this.generateSummaryReport(testCases, featureName),
      description: 'Human-readable test summary report'
    }
  };
}

  // Helper methods
  formatTestSteps(steps) {
    if (!steps) return '';
    
    // Format steps for legacy Xray (numbered format)
    return steps.split('\n')
      .filter(step => step.trim())
      .map((step, index) => {
        const cleanStep = step.replace(/^\d+\.\s*/, '').trim();
        return `${index + 1}. ${cleanStep}`;
      })
      .join('\\n');
  }

  mapPriorityToTestRail(priority) {
    const mapping = {
      'High': '1 - Don\'t Test',
      'Medium': '2 - Medium',
      'Low': '3 - High'
    };
    return mapping[priority] || '2 - Medium';
  }

  mapPriorityToAzure(priority) {
    const mapping = {
      'High': '1',
      'Medium': '2',
      'Low': '3'
    };
    return mapping[priority] || '2';
  }

  escapeCSVRow(row) {
    return row.map(field => {
      if (field === null || field === undefined) return '""';
      const str = String(field);
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    });
  }

  generateSummaryReport(testCases, featureName) {
    const totalCases = testCases.length;
    const byType = {};
    const byPriority = {};

    testCases.forEach(tc => {
      byType[tc.type] = (byType[tc.type] || 0) + 1;
      byPriority[tc.priority] = (byPriority[tc.priority] || 0) + 1;
    });

    return `TEST CASE SUMMARY REPORT
========================

Feature: ${featureName}
Generated: ${new Date().toLocaleDateString()}
Total Test Cases: ${totalCases}

BREAKDOWN BY TYPE:
${Object.entries(byType).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

BREAKDOWN BY PRIORITY:
${Object.entries(byPriority).map(([priority, count]) => `- ${priority}: ${count}`).join('\n')}

XRAY IMPORT INSTRUCTIONS:
========================

1. Go to Test Repository in Jira
2. Click "Import" > "Import Test Cases from CSV"
3. Upload the *_xray.csv file
4. The CSV matches your Xray template format:
   - Test ID (Integer)
   - Summary (String)
   - Description (String)
   - Test Type (String)
   - Step (String)
   - Data (String)
   - Expected Result (String)
   - Repository (String)
5. Map columns automatically and import

TESTRAIL:
1. Go to your TestRail project
2. Click "Cases" > "Import"
3. Upload the *_testrail.csv file
4. Follow the import wizard

AZURE DEVOPS:
1. Go to Test Plans in Azure DevOps
2. Click "Import test cases"
3. Upload the *_azure.csv file
4. Configure field mapping

Generated by AI QA Test Case Generator
`;
  }

  // Legacy method for backward compatibility
  generateCSV(testCases) {
    return this.generateXrayCSV(testCases);
  }
}

module.exports = new CSVExporter();