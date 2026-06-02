const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected route — requires valid JWT
router.get('/me', authMiddleware, getMe);

module.exports = router;
