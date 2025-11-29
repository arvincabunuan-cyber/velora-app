const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const User = require('../models/User');
const { admin } = require('../config/database');

// Create delivery (for sellers/buyers sending documents)
exports.createDelivery = async (req, res) => {
  try {
    const { pickupAddress, deliveryAddress, receiverName, receiverPhone, documentDetails, preferredRider } = req.body;

    console.log('Creating delivery with data:', { pickupAddress, deliveryAddress, receiverName, receiverPhone, documentDetails, preferredRider });

    if (!pickupAddress || !deliveryAddress || !receiverName || !receiverPhone || !documentDetails) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Create delivery directly (₱50 fee for document deliveries)
    const delivery = await Delivery.create({
      sender: req.user.id,
      pickupAddress,
      deliveryAddress,
      receiverName,
      receiverPhone,
      documentDetails,
      preferredRider,
      deliveryFee: 50, // ₱50 for document delivery
      status: 'pending',
      tracking: [{
        status: 'pending',
        timestamp: admin.firestore.Timestamp.now()
      }]
    });

    console.log('Delivery created:', delivery);

    // Notify preferred rider if specified
    const io = req.app.get('io');
    if (io && preferredRider) {
      io.to(`user_${preferredRider}`).emit('newDeliveryRequest', {
        deliveryId: delivery.id,
        deliveryNumber: delivery.deliveryNumber,
        message: `📦 New document delivery request available for pickup! Fee: ₱50`,
        pickupAddress,
        deliveryAddress,
        deliveryFee: 50,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Delivery request created successfully. Fee: ₱50',
      data: delivery
    });
  } catch (error) {
    console.error('Create delivery error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all pending deliveries (for riders to pick)
exports.getPendingDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find({ status: 'pending' });
    console.log('Pending deliveries found:', deliveries.length, deliveries);

    res.status(200).json({ success: true, data: deliveries });
  } catch (error) {
    console.error('Get pending deliveries error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Assign delivery to rider
exports.assignDelivery = async (req, res) => {
  try {
    console.log('Assigning delivery:', req.params.id, 'to rider:', req.user.id);
    
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      console.log('Delivery not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    console.log('Found delivery:', delivery);

    if (delivery.status !== 'pending') {
      console.log('Delivery already assigned, current status:', delivery.status);
      return res.status(400).json({ 
        success: false, 
        message: 'Delivery already assigned' 
      });
    }

    // Create tracking entry with current location
    const tracking = Array.isArray(delivery.tracking) ? [...delivery.tracking] : [];
    tracking.push({
      location: { latitude: 0, longitude: 0 },
      status: 'assigned',
      timestamp: admin.firestore.Timestamp.now()
    });

    console.log('Updating delivery with tracking:', tracking);

    // Update delivery
    const updateResult = await Delivery.findByIdAndUpdate(req.params.id, {
      rider: req.user.id,
      status: 'assigned',
      tracking: tracking
    });

    console.log('Update result:', updateResult);

    // Update order status only if there's an associated order
    if (delivery.order) {
      console.log('Updating associated order:', delivery.order);
      await Order.findByIdAndUpdate(delivery.order, { status: 'picked_up' });
    }

    const updatedDelivery = await Delivery.findById(req.params.id);

    console.log('Delivery assigned successfully:', updatedDelivery);

    res.status(200).json({
      success: true,
      message: 'Delivery assigned successfully',
      data: updatedDelivery
    });
  } catch (error) {
    console.error('Assign delivery error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get rider's deliveries
exports.getRiderDeliveries = async (req, res) => {
  try {
    const { status } = req.query;
    let query = { rider: req.user.id };

    if (status) {
      query.status = status;
    }

    const deliveries = await Delivery.find(query);
    console.log('Rider deliveries found for user', req.user.id, ':', deliveries.length, deliveries);

    res.status(200).json({ success: true, data: deliveries });
  } catch (error) {
    console.error('Get rider deliveries error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update delivery status
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status, location, note } = req.body;
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    // Check if user is the assigned rider
    if (delivery.rider !== req.user.id && req.user.role !== 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this delivery' 
      });
    }

    const tracking = Array.isArray(delivery.tracking) ? [...delivery.tracking] : [];
    tracking.push({
      location,
      status,
      note,
      timestamp: admin.firestore.Timestamp.now()
    });

    const updateData = {
      status: status,
      tracking: tracking
    };

    if (status === 'delivered') {
      updateData.actualDeliveryTime = admin.firestore.Timestamp.now();
      // Update order status only if there's an associated order
      if (delivery.order) {
        await Order.findByIdAndUpdate(delivery.order, { status: 'delivered' });
      }
    }

    await Delivery.findByIdAndUpdate(req.params.id, updateData);
    const updatedDelivery = await Delivery.findById(req.params.id);

    console.log('Delivery status updated:', updatedDelivery);

    res.status(200).json({
      success: true,
      message: 'Delivery status updated successfully',
      data: updatedDelivery
    });
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update rider location
exports.updateRiderLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
      currentLocation: {
        latitude,
        longitude,
        lastUpdated: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Location updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Complete delivery with proof
exports.completeDelivery = async (req, res) => {
  try {
    const { signature, photo, notes } = req.body;
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    if (delivery.rider !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to complete this delivery' 
      });
    }

    await Delivery.findByIdAndUpdate(req.params.id, {
      status: 'delivered',
      actualDeliveryTime: admin.firestore.Timestamp.now(),
      proofOfDelivery: { signature, photo, notes }
    });

    // Update order status only if there's an associated order
    if (delivery.order) {
      await Order.findByIdAndUpdate(delivery.order, { status: 'delivered' });
    }

    const updatedDelivery = await Delivery.findById(req.params.id);

    console.log('Delivery completed:', updatedDelivery);

    res.status(200).json({
      success: true,
      message: 'Delivery completed successfully',
      data: updatedDelivery
    });
  } catch (error) {
    console.error('Complete delivery error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Track delivery
exports.trackDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    // Manually populate rider information with currentLocation
    if (delivery.rider) {
      const rider = await User.findById(delivery.rider);
      if (rider) {
        delivery.rider = {
          id: rider.id,
          name: rider.name,
          phone: rider.phone,
          currentLocation: rider.currentLocation
        };
      }
    }

    // Manually populate order information
    if (delivery.order) {
      const order = await Order.findById(delivery.order);
      if (order) {
        delivery.order = order;
      }
    }

    res.status(200).json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
