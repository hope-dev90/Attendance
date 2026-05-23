const express = require('express');
const router = express.Router();
const { getTimetable, getTimetableByClass } = require('../controllers/timetableController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getTimetable);
router.get('/class/:className', authenticate, getTimetableByClass);

module.exports = router;
