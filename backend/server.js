const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize Firebase
const { db } = require('./src/config/database');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const deliveryRoutes = require('./src/routes/deliveryRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const userRoutes = require('./src/routes/userRoutes');
const riderNoteRoutes = require('./src/routes/riderNoteRoutes');
const riderMessageRoutes = require('./src/routes/riderMessageRoutes');
const faceRoutes = require('./src/routes/faceRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');

// Import socket handlers
const socketHandler = require('./src/sockets/socketHandler');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Make io accessible to routes
app.set('io', io);

// Test Firebase connection
db.listCollections()
  .then(() => console.log('Firebase Firestore connected successfully'))
  .catch((err) => {
    console.error('Firebase connection error:', err.message);
    console.log('\n⚠️  Please enable Firestore in Firebase Console:');
    console.log('   https://console.firebase.google.com/project/velora-1b9c2/firestore');
    console.log('   Or: https://console.cloud.google.com/firestore/databases?project=velora-1b9c2\n');
  });

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Velora API is running',
    timestamp: new Date().toISOString()
  });
});

// Debug emit endpoint (temporary) - use ?key=DEBUG_KEY or set DEBUG_KEY env
app.get('/__debug/emit-order-update', (req, res) => {
  const key = req.query.key || process.env.DEBUG_KEY || 'debugkey';
  if (req.query.key !== key) {
    // allow without key in dev only
    if (process.env.NODE_ENV !== 'development') return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const { orderId, orderNumber, status } = req.query;
  const payload = { orderId, orderNumber, status };
  try {
    io.emit('orderUpdate', payload);
    return res.json({ success: true, message: 'orderUpdate emitted', payload });
  } catch (err) {
    console.error('Debug emit error', err);
    return res.status(500).json({ success: false, message: 'Emit failed' });
  }
});

app.get('/api', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Velora API v1.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      deliveries: '/api/deliveries',
      admin: '/api/admin',
      users: '/api/users'
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rider-notes', riderNoteRoutes);
app.use('/api/rider-messages', riderMessageRoutes);
app.use('/api', faceRoutes);
app.use('/api/reviews', reviewRoutes);

// Socket.IO
socketHandler(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
