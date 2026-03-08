import { auth } from "@/integrations/firebase/client";

import { Platform } from "react-native";
const PRODUCTION_URL = "https://jansathi-server.vercel.app/api"; // ← replace with your actual Render URL
const DEV_URL = Platform.OS === "web" ? "http://localhost:5000/api" : "http://10.100.67.143:5000/api";

const getBaseUrl = () => {
  if (__DEV__) return DEV_URL;
  return PRODUCTION_URL;
};

export const BASE_URL = getBaseUrl();
export const apiRequest = async (
  endpoint: string,
  method: string = "GET",
  body?: object
) => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Not authenticated");
  }

  const token = await currentUser.getIdToken();

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
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Not authenticated");

  const token = await currentUser.getIdToken();

  const formData = new FormData();

  if (imageUri.startsWith("data:") || imageUri.startsWith("http") || imageUri.startsWith("blob:")) {
    // Web: fetch the image and convert to blob
    const imageResponse = await fetch(imageUri);
    const blob = await imageResponse.blob();
    formData.append("image", blob, "image.jpg");
  } else {
    // Mobile: use URI directly
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
