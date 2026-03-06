import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyCkZo5yYP-uiEVcoC6eHAcrZHX31fEz4xo",
  authDomain: "jansathi-eed44.firebaseapp.com",
  projectId: "jansathi-eed44",
  storageBucket: "jansathi-eed44.firebasestorage.app",
  messagingSenderId: "926203078040",
  appId: "1:926203078040:web:f0c82e74eded1274af37ed",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);