# 🤖 AI QA Test Case Generator

[![Node.js CI](https://github.com/yourusername/ai-qa-test-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/ai-qa-test-generator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A full-stack web application that automatically generates comprehensive manual test cases from feature documentation using AI.

## 🌟 Features

- 🤖 **AI-Powered**: Uses Groq API with Llama 3.1 for intelligent test case generation
- 📄 **Multi-Source Input**: Supports PRFAQ docs, Confluence pages, and Jira descriptions
- 📊 **Xray Integration**: Direct CSV export for Xray Test Management
- 🚀 **Full-Stack**: Complete frontend and backend solution
- 🔒 **Secure**: Server-side API calls, no CORS issues
- 📱 **Responsive**: Modern, clean UI that works on all devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Groq API key ([Get one free](https://console.groq.com))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/ai-qa-test-generator.git
cd ai-qa-test-generator

# 2. Install all dependencies
npm run install-all

# 3. Setup environment
cd backend
cp .env.example .env
# Edit .env with your Groq API key

# 4. Start development servers
cd ..
npm run dev
```

### Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📖 Usage

1. Enter your Groq API key and test the connection
2. Upload your feature documentation
3. Configure test generation settings
4. Generate AI-powered test cases
5. Download CSV file for Xray import

## 🐳 Docker Deployment

```bash
npm run docker:up
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.
