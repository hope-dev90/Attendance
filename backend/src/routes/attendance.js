const express = require('express');
const router = express.Router();
const {
  submitAttendance,
  getAttendanceByClassAndDate,
  getAbsentees,
  getAttendanceHistory,
} = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');


router.post('/', authenticate, submitAttendance);


router.get('/history', authenticate, getAttendanceHistory);


router.get('/absentees', authenticate, getAbsentees);


router.get('/:classId/:date', authenticate, getAttendanceByClassAndDate);

module.exports = router;
