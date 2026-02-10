const express = require('express');
const router = express.Router();
const { getAuditLogs, getAuditStats } = require('../controllers/auditLogController');
const { protectAdmin } = require('../middleware/adminAuth');

router.get('/', protectAdmin, getAuditLogs);
router.get('/stats', protectAdmin, getAuditStats);

module.exports = router;
