import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";       // 👈 Import Auth
import { getFirestore } from "firebase/firestore"; // 👈 Import Firestore

const firebaseConfig = {
  apiKey: "AIzaSyB0DteAB-XXkAndstipuF_TW-gUdQtz_Rs",
  authDomain: "aipoweredinterview.firebaseapp.com",
  projectId: "aipoweredinterview",
  storageBucket: "aipoweredinterview.firebasestorage.app",
  messagingSenderId: "90908901150",
  appId: "1:90908901150:web:cc12aad7b7f469c799130f",
  measurementId: "G-5X333SQ5RL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // ✅ FIXED: Changed 'spp' to 'app'

// Export Auth and DB
export const auth = getAuth(app);
export const db = getFirestore(app);