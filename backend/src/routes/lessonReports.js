const express = require('express');
const router  = express.Router();
const { submitLessonReport, getLessonReports } = require('../controllers/lessonReportController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, submitLessonReport);
router.get('/',  authenticate, getLessonReports);

module.exports = router;
