const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Get available riders (public for buyers/sellers)
router.get('/riders', auth, async (req, res) => {
  try {
    // First get all riders
    const allRiders = await User.find({ role: 'rider' });
    
    // Then filter for active riders
    const activeRiders = allRiders.filter(rider => rider.isActive !== false);
    
    const ridersData = activeRiders.map(rider => ({
      id: rider.id,
      name: rider.name,
      phone: rider.phone,
      rating: rider.rating || 0,
      totalRatings: rider.totalRatings || 0,
      isAvailable: rider.isAvailable !== false
    }));
    
    res.status(200).json({ success: true, data: ridersData });
  } catch (error) {
    console.error('Error fetching riders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'phone', 'address', 'profileImage', 'businessName', 'businessDescription'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
