// src/utils/api.js
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem("authToken");

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // CRITICAL FIX FOR IMAGE UPLOADS:
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("adminAuth"); 
      localStorage.removeItem("userName");
      sessionStorage.removeItem("hasSeenWelcome");
      
      window.location.href = "/"; 
      throw new Error("Session expired. Please log in again.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong processing your request");
    }

    return data;
  } catch (error) {
    // ✅ INTERCEPT HARD NETWORK DROPS
    // Prevents the app from treating an internet disconnect or proxy drop as a server data failure
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error(`API Network Error [${endpoint}]: Connection refused or dropped.`);
      throw new Error("Network connection lost. Please check your internet connection.");
    }

    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
};