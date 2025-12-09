const Order = require('../models/Order');
const Product = require('../models/Product');
const Delivery = require('../models/Delivery');
const User = require('../models/User');

// Create order (Buyer)
exports.createOrder = async (req, res) => {
  try {
    const { 
      deliveryType = 'product', 
      items, 
      deliveryAddress, 
      pickupAddress,
      paymentMethod, 
      notes,
      documentDetails,
      seller,
      preferredRider,
      deliveryFee,
      distance,
      pickupCoordinates,
      deliveryCoordinates
    } = req.body;

    let totalAmount = 0;
    let orderItems = [];
    let sellerId = seller;

    // Handle product delivery
    if (deliveryType === 'product') {
      if (!items || items.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Items are required for product delivery' 
        });
      }

      // Validate products and calculate total
      for (const item of items) {
        const product = await Product.findById(item.product);
        
        if (!product) {
          return res.status(404).json({ 
            success: false, 
            message: `Product ${item.product} not found` 
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({ 
            success: false, 
            message: `Insufficient stock for ${product.name}` 
          });
        }

        orderItems.push({
          productId: item.product,
          name: product.name,
          quantity: item.quantity,
          price: product.price,
          image: product.image || null
        });

        totalAmount += product.price * item.quantity;

        // Update product stock
        await Product.findByIdAndUpdate(item.product, {
          stock: product.stock - item.quantity
        });
      }

      // Get seller from first product
      const firstProduct = await Product.findById(items[0].product);
      sellerId = firstProduct.seller;
    } 
    // Handle document delivery
    else if (deliveryType === 'document') {
      if (!documentDetails) {
        return res.status(400).json({ 
          success: false, 
          message: 'Document details are required for document delivery' 
        });
      }

      if (!seller) {
        return res.status(400).json({ 
          success: false, 
          message: 'Seller is required for document delivery' 
        });
      }

      // For document delivery, totalAmount is just the delivery fee
      totalAmount = req.body.totalAmount || 0;
    }

    // Fetch rider information if provided
    let riderInfo = {};
    if (preferredRider && preferredRider !== 'nearby') {
      const rider = await User.findById(preferredRider);
      if (rider) {
        riderInfo = {
          riderId: preferredRider,
          riderName: rider.name,
          riderPhone: rider.phone
        };
      }
    }

    const order = await Order.create({
      buyerId: req.user.id,
      buyer: req.user.id,
      sellerId: sellerId,
      seller: sellerId,
      deliveryType,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      pickupAddress,
      deliveryFee: deliveryFee || 0,
      distance: distance || 0,
      pickupCoordinates,
      deliveryCoordinates,
      paymentMethod,
      notes,
      ...(deliveryType === 'document' && documentDetails ? { documentDetails } : {}),
      ...(preferredRider ? { preferredRider } : {}),
      ...riderInfo,
      statusHistory: [{ status: 'pending', timestamp: new Date() }]
    });

    // Get socket.io instance from app
    const io = req.app.get('io');
    
    if (io) {
      // Notify seller about new order
      io.to(`user_${sellerId}`).emit('newOrderReceived', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        deliveryType: order.deliveryType,
        totalAmount: order.totalAmount,
        buyerId: req.user.id,
        message: `🔔 New ${deliveryType === 'document' ? 'document delivery' : 'order'} received! Amount: ₱${totalAmount}`,
        timestamp: new Date()
      });

      // Notify preferred rider if selected
      if (preferredRider) {
        io.to(`user_${preferredRider}`).emit('newOrderNotification', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          deliveryType: order.deliveryType,
          message: `🚴 You have been selected as preferred rider for a new ${deliveryType === 'document' ? 'document delivery' : 'order'}!`,
          timestamp: new Date()
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `${deliveryType === 'document' ? 'Document delivery' : 'Order'} created successfully`,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get buyer's orders
exports.getBuyerOrders = async (req, res) => {
  try {
    console.log('Fetching orders for buyer:', req.user.id);
    const orders = await Order.find({ buyer: req.user.id });
    console.log('Found buyer orders:', orders.length);

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Error in getBuyerOrders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get seller's orders
exports.getSellerOrders = async (req, res) => {
  try {
    console.log('Fetching orders for seller:', req.user.id);
    const orders = await Order.find({ seller: req.user.id });
    console.log('Found orders:', orders.length);

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Error in getSellerOrders:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check authorization
    if (order.buyer !== req.user.id && 
        order.seller !== req.user.id && 
        req.user.role !== 'superadmin' &&
        req.user.role !== 'rider') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view this order' 
      });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update order status (Seller)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    console.log('Update Order Status - Order seller:', order.seller);
    console.log('Update Order Status - Current user:', req.user.id);
    console.log('Update Order Status - User role:', req.user.role);

    // Check if user is the seller
    if (order.seller !== req.user.id && req.user.role !== 'superadmin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this order' 
      });
    }

    const historyEntry = { status, timestamp: new Date() };
    if (note) {
      historyEntry.note = note;
    }
    const updatedStatusHistory = [...(order.statusHistory || []), historyEntry];
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, {
      status,
      statusHistory: updatedStatusHistory
    });

    // Emit socket event to notify buyer about order status change
    try {
      const io = req.app.get('io');
      if (io && order.buyer) {
        const buyerId = order?.buyer || order?.buyerId;
        io.to(`user_${buyerId}`).emit('orderUpdate', {
          orderId: updatedOrder?.id || updatedOrder?._id || req.params.id,
          status,
          message: `Your order status has been updated to ${status}`,
          timestamp: new Date()
        });
      }
    } catch (emitErr) {
      console.error('Error emitting orderUpdate in updateOrderStatus:', emitErr);
    }

    // If order is confirmed, create a delivery for the rider
    if (status === 'confirmed' && !order.deliveryId) {
      try {
        const delivery = await Delivery.create({
          orderId: req.params.id,
          sender: order.seller || order.sellerId,
          buyer: order.buyer || order.buyerId,
          pickupAddress: order.pickupAddress,
          deliveryAddress: order.deliveryAddress,
          deliveryFee: order.deliveryFee || 0,
          status: 'pending',
          preferredRider: order.preferredRider,
          orderDetails: {
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            items: order.items
          },
          tracking: [{
            status: 'pending',
            timestamp: new Date()
          }]
        });

        // Update order with delivery ID
        await Order.findByIdAndUpdate(req.params.id, {
          deliveryId: delivery.id
        });

        // If delivery has a fee, update the order's deliveryFee and totalAmount so buyer sees final price
        if (delivery.deliveryFee && delivery.deliveryFee > 0) {
          try {
            const newTotal = (order.totalAmount || 0) + delivery.deliveryFee;
            await Order.findByIdAndUpdate(req.params.id, {
              deliveryFee: delivery.deliveryFee,
              totalAmount: newTotal
            });
          } catch (updErr) {
            console.error('Error updating order totals with delivery fee:', updErr);
          }
        }

        // Notify preferred rider if specified
        const io = req.app.get('io');
        if (io && order.preferredRider) {
          io.to(`user_${order.preferredRider}`).emit('newDeliveryRequest', {
            deliveryId: delivery.id,
            deliveryNumber: delivery.deliveryNumber,
            orderId: req.params.id,
            orderNumber: order.orderNumber,
            message: `📦 New delivery ready for pickup! Order: ${order.orderNumber}`,
            pickupAddress: order.pickupAddress,
            deliveryAddress: order.deliveryAddress,
            deliveryFee: order.deliveryFee || 0,
            timestamp: new Date()
          });
        }
      } catch (deliveryError) {
        console.error('Error creating delivery:', deliveryError);
        // Don't fail the order update if delivery creation fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel order (Buyer)
exports.cancelOrder = async (req, res) => {
  try {
    const { cancelReason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if user is the buyer
    if (order.buyer !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to cancel this order' 
      });
    }

    // Can only cancel if order is pending or confirmed
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order cannot be cancelled at this stage' 
      });
    }

    const cancelledStatusHistory = [...(order.statusHistory || []), { 
      status: 'cancelled', 
      note: cancelReason, 
      timestamp: new Date() 
    }];

    const cancelledOrder = await Order.findByIdAndUpdate(req.params.id, {
      status: 'cancelled',
      cancelReason,
      statusHistory: cancelledStatusHistory
    });

    // Restore product stock for product orders only
    if (order.deliveryType !== 'document' && order.items) {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          await Product.findByIdAndUpdate(item.product, {
            stock: product.stock + item.quantity
          });
        }
      }
    }

    // Get socket.io instance to notify seller
    const io = req.app.get('io');
    if (io && order.seller) {
      io.to(`user_${order.seller}`).emit('orderUpdate', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: 'cancelled',
        message: `🚫 Order ${order.orderNumber} has been cancelled by the buyer`,
        cancelReason: cancelReason,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: cancelledOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
