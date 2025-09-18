class TestCaseApp {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.currentTestCases = [];
    this.currentFeatureName = '';
    this.exportFormats = {};
    this.init();
  }

  async init() {
    await this.checkBackendConnection();
    await this.loadExportFormats();
    this.bindEvents();
  }

  async checkBackendConnection() {
    const indicator = document.getElementById('statusIndicator');
    const text = document.getElementById('statusText');
    
    try {
      const response = await fetch(`${this.baseURL}/health`);
      if (response.ok) {
        indicator.textContent = '🟢';
        text.textContent = 'Connected to backend';
      } else {
        throw new Error('Backend not responding');
      }
    } catch (error) {
      indicator.textContent = '🔴';
      text.textContent = 'Backend connection failed';
    }
  }

  async loadExportFormats() {
    try {
      const response = await fetch(`${this.baseURL}/export-formats`);
      const result = await response.json();
      if (result.success) {
        this.exportFormats = result.formats;
      }
    } catch (error) {
      console.error('Failed to load export formats:', error);
    }
  }

  bindEvents() {
    const form = document.getElementById('testCaseForm');
    const testBtn = document.getElementById('testConnectionBtn');
    
    form.addEventListener('submit', this.handleSubmit.bind(this));
    testBtn.addEventListener('click', this.testConnection.bind(this));
    
    document.getElementById('groqApiKey').addEventListener('input', (e) => {
      testBtn.disabled = !e.target.value.trim();
    });
  }

  async testConnection() {
    const apiKey = document.getElementById('groqApiKey').value;
    const btn = document.getElementById('testConnectionBtn');
    
    btn.disabled = true;
    btn.textContent = 'Testing...';

    try {
      const response = await fetch(`${this.baseURL}/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groqApiKey: apiKey })
      });

      const result = await response.json();
      
      if (result.success) {
        this.showAlert(`✅ ${result.message}`, 'success');
      } else {
        this.showAlert(`❌ ${result.error}`, 'error');
      }
    } catch (error) {
      this.showAlert(`❌ Connection failed: ${error.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Test';
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    const formData = this.collectFormData();
    
    if (!this.validateForm(formData)) {
      return;
    }

    this.showLoading();

    try {
      const response = await fetch(`${this.baseURL}/generate-test-cases`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        this.currentTestCases = result.data.testCases;
        this.currentFeatureName = formData.get('featureName');
        this.showResults(result.data);
      } else {
        this.showAlert(`Error: ${result.error}`, 'error');
      }
    } catch (error) {
      this.showAlert(`Error: ${error.message}`, 'error');
    } finally {
      this.hideLoading();
    }
  }

  collectFormData() {
    const formData = new FormData();
    
    formData.append('groqApiKey', document.getElementById('groqApiKey').value);
    formData.append('featureName', document.getElementById('featureName').value);
    formData.append('confluenceContent', document.getElementById('confluenceContent').value);
    formData.append('jiraDescription', document.getElementById('jiraDescription').value);
    formData.append('testCount', document.getElementById('testCount').value);

    const prfaqFile = document.getElementById('prfaqFile').files[0];
    if (prfaqFile) {
      formData.append('prfaqFile', prfaqFile);
    }

    const selectedTestTypes = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
      .map(cb => cb.value);
    formData.append('testTypes', JSON.stringify(selectedTestTypes));

    return formData;
  }

  validateForm(formData) {
    const apiKey = formData.get('groqApiKey');
    const featureName = formData.get('featureName');
    const testTypes = JSON.parse(formData.get('testTypes'));

    if (!apiKey) {
      this.showAlert('Please enter your Groq API key', 'error');
      return false;
    }

    if (!featureName) {
      this.showAlert('Please enter a feature name', 'error');
      return false;
    }

    if (testTypes.length === 0) {
      this.showAlert('Please select at least one test type', 'error');
      return false;
    }

    return true;
  }

  showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('results').style.display = 'none';
  }

  hideLoading() {
    document.getElementById('loading').style.display = 'none';
  }

  showResults(data) {
    const resultsDiv = document.getElementById('results');
    
    let html = `
      <h2>✅ Generated ${data.count} Test Cases</h2>
      <div class="export-section">
        ${this.generateExportButtons(data.exports)}
      </div>
      <div class="export-info">
        <h3>📋 Export Information</h3>
        <div class="export-grid">
          ${this.generateExportInfo()}
        </div>
      </div>
      <div style="margin-top: 30px;">
        <h3>📊 Test Case Preview</h3>
    `;
    
    data.testCases.forEach((testCase, index) => {
      if (index < 3) {
        html += this.generateTestCaseHTML(testCase);
      }
    });

    if (data.testCases.length > 3) {
      html += `
        <div class="more-cases">
          <p><strong>+ ${data.testCases.length - 3} more test cases...</strong></p>
          <p>Download the complete set using the export buttons above.</p>
        </div>
      `;
    }
    
    html += '</div>';
    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
    
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
  }

  generateExportButtons(exports) {
    let html = '<div class="export-buttons">';
    
    const featuredFormats = ['xray', 'testrail', 'azure'];
    featuredFormats.forEach(format => {
      if (exports[format]) {
        const exportData = exports[format];
        html += `
          <button class="export-btn ${format === 'xray' ? 'primary' : 'secondary'}" 
                  onclick="app.downloadExport('${format}')">
            ${this.getFormatIcon(format)} ${this.getFormatDisplayName(format)}
            <small>${exportData.description}</small>
          </button>
        `;
      }
    });

    html += '<div class="more-exports" style="margin-top: 15px;">';
    html += '<details><summary>More Export Formats</summary><div class="additional-exports">';
    
    Object.keys(exports).forEach(format => {
      if (!featuredFormats.includes(format)) {
        const exportData = exports[format];
        html += `
          <button class="export-btn small" onclick="app.downloadExport('${format}')">
            ${this.getFormatIcon(format)} ${this.getFormatDisplayName(format)}
            <small>${exportData.description}</small>
          </button>
        `;
      }
    });
    
    html += '</div></details></div></div>';
    return html;
  }

  generateExportInfo() {
    const infoCards = [
      {
        icon: '🎯',
        title: 'Xray Integration',
        description: 'Direct import into Jira with Xray Test Management plugin'
      },
      {
        icon: '🚀',
        title: 'TestRail Ready',
        description: 'Compatible with TestRail test case management system'
      },
      {
        icon: '☁️',
        title: 'Azure DevOps',
        description: 'Import directly into Azure DevOps Test Plans'
      },
      {
        icon: '📊',
        title: 'Multiple Formats',
        description: 'JSON, CSV, and summary reports available'
      }
    ];

    return infoCards.map(card => `
      <div class="info-card">
        <div class="info-icon">${card.icon}</div>
        <h4>${card.title}</h4>
        <p>${card.description}</p>
      </div>
    `).join('');
  }

  generateTestCaseHTML(testCase) {
    return `
      <div class="test-case">
        <h4>${testCase.id}: ${testCase.summary}</h4>
        <div class="test-case-meta">
          <div class="meta-item">
            <strong>Priority:</strong> ${testCase.priority}
          </div>
          <div class="meta-item">
            <strong>Type:</strong> ${testCase.type}
          </div>
          <div class="meta-item">
            <strong>Category:</strong> ${testCase.category}
          </div>
        </div>
        <div class="meta-item">
          <strong>Preconditions:</strong> ${testCase.preconditions}
        </div>
        <div class="meta-item">
          <strong>Steps:</strong> ${testCase.steps.replace(/\n/g, '<br>')}
        </div>
        <div class="meta-item">
          <strong>Expected Result:</strong> ${testCase.expectedResult}
        </div>
      </div>
    `;
  }

  getFormatIcon(format) {
    const icons = {
      xray: '🎯',
      simple: '📄',
      testrail: '🚀',
      azure: '☁️',
      json: '{ }',
      summary: '📋'
    };
    return icons[format] || '📁';
  }

  getFormatDisplayName(format) {
    const names = {
      xray: 'Xray (Jira)',
      simple: 'Simple CSV',
      testrail: 'TestRail',
      azure: 'Azure DevOps',
      json: 'JSON Data',
      summary: 'Summary Report'
    };
    return names[format] || format.toUpperCase();
  }

  // In your frontend/public/js/app.js file
// Replace the downloadExport function with this:

async downloadExport(format) {
  try {
    console.log(`Downloading ${format} format...`); // Debug log
    
    const response = await fetch(`${this.baseURL}/download-export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        format: format,
        testCases: this.currentTestCases,
        featureName: this.currentFeatureName
      })
    });

    console.log('Response status:', response.status); // Debug log

    if (response.ok) {
      const blob = await response.blob();
      console.log('Blob created, size:', blob.size); // Debug log
      
      // Create proper filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      const baseName = `${this.currentFeatureName.replace(/\s+/g, '_')}_${timestamp}`;
      
      let filename;
      switch(format) {
        case 'xray':
          filename = `${baseName}_xray.csv`;
          break;
        case 'testrail':
          filename = `${baseName}_testrail.csv`;
          break;
        case 'azure':
          filename = `${baseName}_azure.csv`;
          break;
        case 'simple':
          filename = `${baseName}_simple.csv`;
          break;
        case 'json':
          filename = `${baseName}_data.json`;
          break;
        case 'summary':
          filename = `${baseName}_summary.txt`;
          break;
        default:
          filename = `export_${format}.csv`;
      }
      
      console.log('Downloading as:', filename); // Debug log
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      
      // Add to DOM, click, then remove
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      this.showAlert(`✅ ${this.getFormatDisplayName(format)} downloaded successfully!`, 'success');
      
    } else {
      console.error('Response not OK:', response.status);
      const error = await response.json().catch(() => ({error: 'Download failed'}));
      this.showAlert(`❌ Download failed: ${error.error}`, 'error');
    }
  } catch (error) {
    console.error('Download error:', error);
    this.showAlert(`❌ Download failed: ${error.message}`, 'error');
  }
}

  downloadCSV(csvData) {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `test_cases_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" class="alert-close">&times;</button>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove();
      }
    }, 5000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new TestCaseApp();
});
