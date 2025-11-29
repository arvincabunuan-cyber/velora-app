const express = require('express');
const router = express.Router();
const {
  createOrder,
  getBuyerOrders,
  getSellerOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/orderController');
const { auth, authorize } = require('../middleware/auth');

router.post('/', auth, authorize('buyer', 'seller'), createOrder);
router.get('/buyer', auth, authorize('buyer'), getBuyerOrders);
router.get('/seller', auth, authorize('seller'), getSellerOrders);
router.get('/:id', auth, getOrder);
router.put('/:id/status', auth, authorize('seller', 'superadmin'), updateOrderStatus);
router.put('/:id/cancel', auth, authorize('buyer'), cancelOrder);

module.exports = router;
