module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join room for specific user
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined room`);
    });

    // Rider location update
    socket.on('updateLocation', (data) => {
      const { riderId, location, deliveryId } = data;
      
      // Broadcast location to delivery room
      if (deliveryId) {
        socket.to(`delivery_${deliveryId}`).emit('locationUpdated', {
          riderId,
          location,
          timestamp: new Date()
        });
      }
    });

    // Join delivery tracking room
    socket.on('trackDelivery', (deliveryId) => {
      socket.join(`delivery_${deliveryId}`);
      console.log(`Client joined delivery tracking: ${deliveryId}`);
    });

    // Order status update notification
    socket.on('orderStatusUpdate', (data) => {
      const { orderId, buyerId, sellerId, status } = data;
      
      // Notify buyer
      io.to(`user_${buyerId}`).emit('orderUpdate', {
        orderId,
        status,
        message: `Your order status has been updated to ${status}`,
        timestamp: new Date()
      });

      // Notify seller
      io.to(`user_${sellerId}`).emit('orderUpdate', {
        orderId,
        status,
        message: `Order ${orderId} status updated to ${status}`,
        timestamp: new Date()
      });
    });

    // New order notification to seller
    socket.on('newOrder', (data) => {
      const { sellerId, orderData } = data;
      
      io.to(`user_${sellerId}`).emit('newOrderReceived', {
        order: orderData,
        message: 'You have received a new order!',
        timestamp: new Date()
      });
    });

    // Delivery assignment notification
    socket.on('deliveryAssigned', (data) => {
      const { riderId, deliveryData } = data;
      
      io.to(`user_${riderId}`).emit('newDeliveryAssigned', {
        delivery: deliveryData,
        message: 'New delivery assigned to you!',
        timestamp: new Date()
      });
    });

    // Chat messages
    socket.on('sendMessage', (data) => {
      const { senderId, receiverId, message } = data;
      
      io.to(`user_${receiverId}`).emit('newMessage', {
        senderId,
        message,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};
