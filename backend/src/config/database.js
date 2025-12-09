const admin = require('firebase-admin');

// Initialize Firebase Admin
const initializeFirebase = () => {
  try {
    if (!admin.apps.length) {
      // Try to use service account JSON if available (production)
      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      } 
      // Use individual environment variables (alternative)
      else if (process.env.FIREBASE_PRIVATE_KEY) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: privateKey,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }),
        });
      }
      // Local development - use service account file
      else {
        const serviceAccount = require('../../velora-1b9c2-firebase-adminsdk-fbsvc-51e80e003e.json');
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }
      console.log('Firebase Admin initialized successfully');
    }
    return admin.firestore();
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
    throw error;
  }
};

const db = initializeFirebase();

module.exports = { db, admin };
