const express = require('express');
const router = express.Router();
const { adminLogin, adminLogout, getAdminMe } = require('../controllers/adminAuthController');
const { protectAdmin } = require('../middleware/adminAuth');
const { validate, adminLoginSchema } = require('../middleware/validate');

router.post('/login', validate(adminLoginSchema), adminLogin);
router.post('/logout', protectAdmin, adminLogout);
router.get('/me', protectAdmin, getAdminMe);

module.exports = router;
