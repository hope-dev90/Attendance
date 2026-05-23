const express = require('express');
const router = express.Router();
const { signup, verifyOTP, resendOTP, login, refresh, logout, me, updateProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/signup', authLimiter, signup);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/resend-otp', authLimiter, resendOTP);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.put('/profile', authenticate, updateProfile);

module.exports = router;
