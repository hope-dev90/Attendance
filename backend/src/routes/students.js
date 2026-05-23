const express = require('express');
const router = express.Router();
const { getStudentsByClass, addStudents } = require('../controllers/studentController');
const { authenticate } = require('../middleware/auth');

// Get students for the logged-in rep's class
router.get('/my-class', authenticate, getStudentsByClass);

// Get students for a specific class (StaffNet-ready)
router.get('/class/:classId', authenticate, getStudentsByClass);

// Bulk add students
router.post('/bulk', authenticate, addStudents);

module.exports = router;
