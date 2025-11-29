const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getSellerProducts
} = require('../controllers/productController');
const { auth, authorize } = require('../middleware/auth');

router.get('/', getAllProducts);
router.get('/my-products', auth, authorize('seller'), getSellerProducts);
router.get('/:id', getProduct);
router.post('/', auth, authorize('seller'), createProduct);
router.put('/:id', auth, authorize('seller', 'superadmin'), updateProduct);
router.delete('/:id', auth, deleteProduct);

module.exports = router;
