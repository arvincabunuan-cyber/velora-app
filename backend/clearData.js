const admin = require('firebase-admin');
const serviceAccount = require('./velora-1b9c2-firebase-adminsdk-fbsvc-51e80e003e.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function clearAllData() {
  try {
    console.log('Starting to delete all orders and deliveries...\n');
    
    // Delete Orders
    const ordersRef = db.collection('orders');
    const ordersSnapshot = await ordersRef.get();
    
    if (!ordersSnapshot.empty) {
      console.log(`Found ${ordersSnapshot.size} orders to delete.`);
      const ordersBatch = db.batch();
      ordersSnapshot.docs.forEach((doc) => {
        ordersBatch.delete(doc.ref);
      });
      await ordersBatch.commit();
      console.log(`✅ Deleted ${ordersSnapshot.size} orders!\n`);
    } else {
      console.log('No orders found.\n');
    }
    
    // Delete Deliveries
    const deliveriesRef = db.collection('deliveries');
    const deliveriesSnapshot = await deliveriesRef.get();
    
    if (!deliveriesSnapshot.empty) {
      console.log(`Found ${deliveriesSnapshot.size} deliveries to delete.`);
      const deliveriesBatch = db.batch();
      deliveriesSnapshot.docs.forEach((doc) => {
        deliveriesBatch.delete(doc.ref);
      });
      await deliveriesBatch.commit();
      console.log(`✅ Deleted ${deliveriesSnapshot.size} deliveries!\n`);
    } else {
      console.log('No deliveries found.\n');
    }
    
    console.log('✅ All data cleared! Ready for simulation.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

clearAllData();
