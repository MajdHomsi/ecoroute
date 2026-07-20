const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

router.post('/chat', authMiddleware, chat);

module.exports = router;