const express = require('express');
const router = express.Router();
const {
  createDelivery,
  getPendingDeliveries,
  assignDelivery,
  getRiderDeliveries,
  updateDeliveryStatus,
  updateRiderLocation,
  completeDelivery,
  trackDelivery
} = require('../controllers/deliveryController');
const { auth, authorize } = require('../middleware/auth');

router.post('/', auth, authorize('seller', 'buyer'), createDelivery);
router.get('/pending', auth, authorize('rider'), getPendingDeliveries);
router.get('/rider', auth, authorize('rider'), getRiderDeliveries);
router.put('/:id/assign', auth, authorize('rider'), assignDelivery);
router.put('/:id/status', auth, authorize('rider', 'superadmin'), updateDeliveryStatus);
router.put('/location', auth, authorize('rider'), updateRiderLocation);
router.put('/:id/complete', auth, authorize('rider'), completeDelivery);
router.get('/:id/track', trackDelivery);

module.exports = router;
