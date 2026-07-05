import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBVKXgAIxiQq5nOUT-lmbcQ76ybU6YVPuk",
  authDomain: "kotar-2c20a.firebaseapp.com",
  projectId: "kotar-2c20a",
  storageBucket: "kotar-2c20a.firebasestorage.app",
  messagingSenderId: "775171341341",
  appId: "1:775171341341:web:37c93fcf1b3ecf72f5daf4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
