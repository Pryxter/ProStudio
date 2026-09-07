// Import Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration (replace with your project's config)
const firebaseConfig = {
    apiKey: "AIzaSyCnb9DVMvy9FaKk3mr33xyr50zWvaUFK5k",
    authDomain: "eternal-600e8.firebaseapp.com",
    projectId: "eternal-600e8",
    storageBucket: "eternal-600e8.firebasestorage.app",
    messagingSenderId: "835201091808",
    appId: "1:835201091808:web:c8d5d029c3eb5003842885"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;
