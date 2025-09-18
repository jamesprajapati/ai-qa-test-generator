class CSVExporter {
  generateCSV(testCases) {
    const headers = [
      'Test ID', 'Summary', 'Priority', 'Test Type', 'Category',
      'Preconditions', 'Test Steps', 'Expected Result', 'Labels'
    ];

    let csvContent = headers.join(',') + '\n';

    testCases.forEach(testCase => {
      const row = [
        `"${testCase.id}"`,
        `"${testCase.summary}"`,
        `"${testCase.priority}"`,
        `"${testCase.type}"`,
        `"${testCase.category}"`,
        `"${testCase.preconditions}"`,
        `"${testCase.steps.replace(/"/g, '""')}"`,
        `"${testCase.expectedResult}"`,
        `"manual,ai-generated"`
      ];
      csvContent += row.join(',') + '\n';
    });

    return csvContent;
  }
}

module.exports = new CSVExporter();
