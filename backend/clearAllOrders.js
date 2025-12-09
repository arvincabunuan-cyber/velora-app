const admin = require('firebase-admin');
const serviceAccount = require('./velora-1b9c2-firebase-adminsdk-fbsvc-51e80e003e.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function clearAllOrders() {
  try {
    console.log('Starting to delete all orders...');
    
    const ordersRef = db.collection('orders');
    const snapshot = await ordersRef.get();
    
    if (snapshot.empty) {
      console.log('No orders found to delete.');
      return;
    }
    
    console.log(`Found ${snapshot.size} orders to delete.`);
    
    const batch = db.batch();
    let count = 0;
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
      console.log(`Queued for deletion: ${doc.id}`);
    });
    
    await batch.commit();
    console.log(`✅ Successfully deleted ${count} orders!`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error deleting orders:', error);
    process.exit(1);
  }
}

clearAllOrders();
