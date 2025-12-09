const admin = require('firebase-admin');
const serviceAccount = require('./velora-1b9c2-firebase-adminsdk-fbsvc-51e80e003e.json');

console.log('Initializing Firebase...');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testConnection() {
  try {
    console.log('Testing Firestore connection...');
    
    // Set a timeout
    const timeout = setTimeout(() => {
      console.error('❌ Connection timeout after 10 seconds');
      process.exit(1);
    }, 10000);
    
    const testDoc = await db.collection('_test').doc('connection').set({
      timestamp: admin.firestore.Timestamp.now(),
      test: true
    });
    
    clearTimeout(timeout);
    console.log('✅ Firestore connection successful!');
    
    // Clean up test
    await db.collection('_test').doc('connection').delete();
    console.log('✅ Test cleanup complete');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
