const express = require('express');
const multer = require('multer');
const testCaseController = require('../controllers/testCaseController');
const healthController = require('../controllers/healthController');
const validation = require('../middleware/validation');

const router = express.Router();

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/plain', 
      'application/pdf', 
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: TXT, PDF, DOC, DOCX'), false);
    }
  }
});

router.get('/health', healthController.healthCheck);
router.get('/api/health', healthController.healthCheck);

router.post('/api/test-connection',
  validation.validateConnectionTest,
  testCaseController.testConnection
);

router.post('/api/generate-test-cases', 
  upload.single('prfaqFile'),
  validation.validateTestCaseRequest,
  testCaseController.generateTestCases
);

router.get('/api/export-formats',
  testCaseController.getExportFormats
);

router.post('/api/download-export',
  testCaseController.downloadExport
);

router.post('/api/download-csv', 
  (req, res) => {
    req.body.format = 'xray';
    testCaseController.downloadExport(req, res);
  }
);

module.exports = router;
