const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getDashboardStats,
  toggleUserStatus,
  deleteUser,
  getAllOrders,
  getAllDeliveries
} = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth, authorize('superadmin'));

router.get('/users', getAllUsers);
router.get('/stats', getDashboardStats);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUser);
router.get('/orders', getAllOrders);
router.get('/deliveries', getAllDeliveries);

module.exports = router;
