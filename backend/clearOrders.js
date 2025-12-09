const admin = require('firebase-admin');
const serviceAccount = require('./velora-1b9c2-firebase-adminsdk-fbsvc-51e80e003e.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function clearOrders() {
  try {
    console.log('Starting to delete all orders...');
    
    // Get all orders
    const ordersSnapshot = await db.collection('orders').get();
    console.log(`Found ${ordersSnapshot.size} orders to delete`);
    
    // Delete in batches
    const batchSize = 500;
    let batch = db.batch();
    let count = 0;
    
    for (const doc of ordersSnapshot.docs) {
      batch.delete(doc.ref);
      count++;
      
      if (count % batchSize === 0) {
        await batch.commit();
        console.log(`Deleted ${count} orders...`);
        batch = db.batch();
      }
    }
    
    // Commit remaining
    if (count % batchSize !== 0) {
      await batch.commit();
    }
    
    console.log(`✅ Successfully deleted ${count} orders`);
    
    // Also clear deliveries
    console.log('\nStarting to delete all deliveries...');
    const deliveriesSnapshot = await db.collection('deliveries').get();
    console.log(`Found ${deliveriesSnapshot.size} deliveries to delete`);
    
    batch = db.batch();
    count = 0;
    
    for (const doc of deliveriesSnapshot.docs) {
      batch.delete(doc.ref);
      count++;
      
      if (count % batchSize === 0) {
        await batch.commit();
        console.log(`Deleted ${count} deliveries...`);
        batch = db.batch();
      }
    }
    
    // Commit remaining
    if (count % batchSize !== 0) {
      await batch.commit();
    }
    
    console.log(`✅ Successfully deleted ${count} deliveries`);
    console.log('\n🎉 All orders and deliveries cleared!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing orders:', error);
    process.exit(1);
  }
}

clearOrders();
