const fs = require('fs').promises;
const mammoth = require('mammoth');
const pdf = require('pdf-parse');

class DocumentProcessor {
  async processFile(file) {
    try {
      if (file.mimetype === 'text/plain') {
        return await fs.readFile(file.path, 'utf8');
      } else if (file.mimetype === 'application/pdf') {
        const dataBuffer = await fs.readFile(file.path);
        const data = await pdf(dataBuffer);
        return data.text;
      } else if (file.mimetype.includes('word')) {
        const result = await mammoth.extractRawText({ path: file.path });
        return result.value;
      }
      
      throw new Error('Unsupported file type');
    } finally {
      // Clean up uploaded file
      await fs.unlink(file.path).catch(() => {});
    }
  }
}

module.exports = new DocumentProcessor();
