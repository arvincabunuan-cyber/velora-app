const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Create a review (buyers only, must have ordered the product)
router.post('/', auth, async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;
    
    // Verify user is a buyer
    if (req.user.role !== 'buyer') {
      return res.status(403).json({ success: false, message: 'Only buyers can leave reviews' });
    }

    // Verify order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order || order.buyerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Invalid order' });
    }

    // Check if already reviewed
    const existingReview = await Review.find({ productId, buyerId: req.user.id, orderId });
    if (existingReview.length > 0) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    // Create review
    const review = await Review.create({
      productId,
      orderId,
      buyerId: req.user.id,
      buyerName: req.user.name,
      rating: parseInt(rating),
      comment
    });

    // Update product rating
    const allReviews = await Review.find({ productId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews: allReviews.length
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get seller's product reviews
router.get('/seller', auth, async (req, res) => {
  try {
    // Get seller's products
    const products = await Product.find({ sellerId: req.user.id });
    const productIds = products.map(p => p.id);

    // Get all reviews for these products
    const allReviews = [];
    for (const productId of productIds) {
      const reviews = await Review.find({ productId });
      allReviews.push(...reviews.map(r => ({
        ...r,
        productName: products.find(p => p.id === productId)?.name || 'Unknown Product'
      })));
    }

    res.status(200).json({ success: true, data: allReviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
