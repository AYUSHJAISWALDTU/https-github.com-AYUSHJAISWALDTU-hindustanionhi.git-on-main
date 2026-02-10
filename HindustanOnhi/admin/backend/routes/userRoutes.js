const express = require('express');
const router = express.Router();
const { getUsers, getUser, toggleBlockUser } = require('../controllers/adminUserController');
const { protectAdmin } = require('../middleware/adminAuth');

router.use(protectAdmin);

router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id/block', toggleBlockUser);

module.exports = router;
