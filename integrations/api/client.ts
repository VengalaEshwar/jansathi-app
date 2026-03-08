import { auth } from "@/integrations/firebase/client";
import { Platform } from "react-native";

const PRODUCTION_URL = "https://jansathi-server.vercel.app/api";
const DEV_URL = Platform.OS === "web"
  ? "http://localhost:8081/api"
  : "http://10.100.67.143:5000/api";

export const BASE_URL = __DEV__ ? DEV_URL : PRODUCTION_URL;

// Helper to wait for Firebase auth to be ready
const getToken = (): Promise<string | null> => {
  return new Promise((resolve) => {
    // If already logged in, get token immediately
    if (auth.currentUser) {
      auth.currentUser.getIdToken().then(resolve).catch(() => resolve(null));
      return;
    }
    // Otherwise wait for auth state to load
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      if (user) {
        const token = await user.getIdToken();
        resolve(token);
      } else {
        resolve(null);
      }
    });
  });
};

export const apiRequest = async (
  endpoint: string,
  method: string = "GET",
  body?: object
) => {
  const token = await getToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Request failed");
  }

  return response.json();
};

export const apiUploadImage = async (endpoint: string, imageUri: string) => {
  const token = await getToken();

  if (!token) throw new Error("Not authenticated");

  const formData = new FormData();

  if (imageUri.startsWith("data:") || imageUri.startsWith("http") || imageUri.startsWith("blob:")) {
    const imageResponse = await fetch(imageUri);
    const blob = await imageResponse.blob();
    formData.append("image", blob, "image.jpg");
  } else {
    formData.append("image", {
      uri: imageUri,
      type: "image/jpeg",
      name: "image.jpg",
    } as any);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Upload failed");
  }

  return response.json();
};