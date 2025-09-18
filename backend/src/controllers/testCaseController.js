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
      groqApiKey,
      exportFormat = 'xray'
    } = req.body;

    logger.info(`Generating test cases for feature: ${featureName}`);

    let prfaqContent = '';
    if (req.file) {
      prfaqContent = await documentProcessor.processFile(req.file);
    }

    const combinedContent = [prfaqContent, confluenceContent, jiraDescription]
      .filter(Boolean)
      .join('\n\n');

    const testCases = await testCaseGenerator.generate({
      featureName,
      content: combinedContent,
      testTypes: JSON.parse(testTypes),
      testCount: parseInt(testCount),
      apiKey: groqApiKey
    });

    const exportPackage = csvExporter.generateExportPackage(testCases, featureName);

    res.json({
      success: true,
      data: {
        testCases,
        exports: exportPackage,
        count: testCases.length,
        csvData: exportPackage.xray.content
      }
    });

    logger.info(`Successfully generated ${testCases.length} test cases with ${Object.keys(exportPackage).length} export formats`);

  } catch (error) {
    logger.error('Error generating test cases:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// In your testCaseController.js - Update the downloadExport function

const downloadExport = async (req, res) => {
  try {
    const { format, testCases, featureName } = req.body;

    if (!testCases || !Array.isArray(testCases)) {
      return res.status(400).json({
        success: false,
        error: 'Test cases data is required'
      });
    }

    const exportPackage = csvExporter.generateExportPackage(testCases, featureName || 'TestCases');
    
    if (!exportPackage[format]) {
      return res.status(400).json({
        success: false,
        error: `Unsupported format: ${format}. Available: ${Object.keys(exportPackage).join(', ')}`
      });
    }

    const exportData = exportPackage[format];
    
    // IMPORTANT: Set correct content type and filename
    let contentType = 'text/csv';
    let filename = exportData.filename;
    
    // Make sure Xray format gets .csv extension
    if (format === 'xray') {
      contentType = 'text/csv';
      if (!filename.endsWith('.csv')) {
        filename = filename.replace(/\.[^.]*$/, '.csv'); // Replace any extension with .csv
      }
    } else if (format === 'json') {
      contentType = 'application/json';
    } else {
      contentType = 'text/csv';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData.content);

    logger.info(`Downloaded ${format} export: ${filename} for ${testCases.length} test cases`);

  } catch (error) {
    logger.error('Error downloading export:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getExportFormats = (req, res) => {
  const formats = {
    xray: {
      name: 'Xray Test Management',
      description: 'Standard Xray CSV format for Jira integration',
      fileType: 'CSV',
      recommended: true
    },
    simple: {
      name: 'Simple CSV',
      description: 'Basic CSV format for general use',
      fileType: 'CSV',
      recommended: false
    },
    testrail: {
      name: 'TestRail',
      description: 'TestRail compatible CSV format',
      fileType: 'CSV',
      recommended: false
    },
    azure: {
      name: 'Azure DevOps',
      description: 'Azure DevOps Test Plans compatible format',
      fileType: 'CSV',
      recommended: false
    },
    json: {
      name: 'JSON Data',
      description: 'Raw JSON format for custom integrations',
      fileType: 'JSON',
      recommended: false
    },
    summary: {
      name: 'Summary Report',
      description: 'Human-readable test case summary',
      fileType: 'TXT',
      recommended: false
    }
  };

  res.json({
    success: true,
    formats
  });
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
  downloadExport,
  getExportFormats,
  testConnection
};
