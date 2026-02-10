const express = require('express');
const router = express.Router();
const { getCarts, clearCart } = require('../controllers/adminCartController');
const { protectAdmin } = require('../middleware/adminAuth');

router.use(protectAdmin);

router.get('/', getCarts);
router.delete('/:cartId', clearCart);

module.exports = router;
