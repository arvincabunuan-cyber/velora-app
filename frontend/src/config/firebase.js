import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAahkezVcrJYdoxfSvCYiPWuHFZOiEFli4",
  authDomain: "velora-1b9c2.firebaseapp.com",
  projectId: "velora-1b9c2",
  storageBucket: "velora-1b9c2.firebasestorage.app",
  messagingSenderId: "563490608258",
  appId: "1:563490608258:web:ac57008f0d4a1fb6bd109b",
  measurementId: "G-Y9GRGEVH7E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { auth, db, analytics };
export default app;
