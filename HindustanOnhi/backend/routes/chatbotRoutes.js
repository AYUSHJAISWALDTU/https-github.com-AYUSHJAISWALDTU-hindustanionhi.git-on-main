const express = require('express');
const router = express.Router();
const { sendMessage, getHistory } = require('../controllers/chatbotController');

router.post('/message', sendMessage);
router.get('/history/:sessionId', getHistory);

module.exports = router;
