const express = require('express');
const router = express.Router();
const { getAllClasses, createClass } = require('../controllers/classController');

// Public — needed for signup dropdown
router.get('/', getAllClasses);

// Protected — admin use (can lock down later)
router.post('/', createClass);

module.exports = router;
