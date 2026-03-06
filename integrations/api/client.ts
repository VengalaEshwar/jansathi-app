import { auth } from "@/integrations/firebase/client";

// const BASE_URL = "http://10.0.2.2:5000/api"; // Android emulator
const BASE_URL = "http://localhost:5000/api"; // iOS simulator or web

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