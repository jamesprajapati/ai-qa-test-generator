const express = require('express');
const multer = require('multer');
const testCaseController = require('../controllers/testCaseController');
const healthController = require('../controllers/healthController');
const validation = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/plain', 'application/pdf', 'application/msword'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Health check
router.get('/health', healthController.healthCheck);
router.get('/api/health', healthController.healthCheck);

// API endpoints
router.post('/api/test-connection',
  validation.validateConnectionTest,
  testCaseController.testConnection
);

router.post('/api/generate-test-cases', 
  upload.single('prfaqFile'),
  validation.validateTestCaseRequest,
  testCaseController.generateTestCases
);

module.exports = router;
