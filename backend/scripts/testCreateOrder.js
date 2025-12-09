const { db } = require('../src/config/database');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { jwtSecret } = require('../src/config/constants');

(async () => {
  try {
    console.log('Looking for a buyer user in Firestore...');
    const usersSnap = await db.collection('users').where('role', '==', 'buyer').limit(1).get();
    if (usersSnap.empty) {
      console.log('No buyer user found in Firestore.');
      return;
    }

    const doc = usersSnap.docs[0];
    const userId = doc.id;
    console.log('Found buyer userId:', userId);

    const token = jwt.sign({ id: userId }, jwtSecret, { expiresIn: '1h' });
    console.log('Generated JWT (first 60 chars):', token.slice(0, 60) + '...');

    const orderData = {
      items: [],
      pickupCoordinates: { latitude: 14.5995, longitude: 120.9842 },
      deliveryCoordinates: { latitude: 14.6095, longitude: 120.9742 },
      deliveryFee: 50
    };

    console.log('Sending POST /api/orders to http://localhost:5000/api/orders');
    const res = await axios.post('http://localhost:5000/api/orders', orderData, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });

    console.log('Response status:', res.status);
    console.log('Response data:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('Request failed with status:', err.response.status);
      console.error('Response data:', err.response.data);
    } else {
      console.error('Error sending request:', err.message);
    }
  }
})();
