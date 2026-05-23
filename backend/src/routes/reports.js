const express = require('express');
const router = express.Router();
const { getReports, downloadCSV, downloadPDF } = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

// Patron dashboard — list all reports
router.get('/', authenticate, getReports);

// Download individual report
router.get('/:id/csv', authenticate, downloadCSV);
router.get('/:id/pdf', authenticate, downloadPDF);

module.exports = router;
