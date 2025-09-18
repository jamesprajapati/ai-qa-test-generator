class TestCaseApp {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.init();
  }

  async init() {
    this.checkBackendConnection();
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

  bindEvents() {
    const form = document.getElementById('testCaseForm');
    const testBtn = document.getElementById('testConnectionBtn');
    
    form.addEventListener('submit', this.handleSubmit.bind(this));
    testBtn.addEventListener('click', this.testConnection.bind(this));
    
    // Enable test button when API key is entered
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
      <button class="download-btn" onclick="app.downloadCSV('${data.csvData}')">
        📥 Download CSV for Xray
      </button>
      <div style="margin-top: 20px;">
    `;
    
    data.testCases.forEach(testCase => {
      html += `
        <div class="test-case">
          <h3>${testCase.id}: ${testCase.summary}</h3>
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
    });
    
    html += '</div>';
    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
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
    // Simple alert for now - could be enhanced with toast notifications
    alert(message);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new TestCaseApp();
});
