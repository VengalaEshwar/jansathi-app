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

let auth: any;

try {
  if (Platform.OS !== "web") {
    const { initializeAuth, getReactNativePersistence } = require("firebase/auth");
    const ReactNativeAsyncStorage = require("@react-native-async-storage/async-storage").default;
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } else {
    auth = getAuth(app);
  }
} catch (e) {
  // Already initialized — just get the existing instance
  auth = getAuth(app);
}

export { auth };