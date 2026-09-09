// src/utils/api.js
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem("authToken");

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // CRITICAL FIX FOR IMAGE UPLOADS:
  // If the body is FormData (used for file uploads), we MUST NOT set "Content-Type": "application/json".
  // The browser will automatically set "Content-Type: multipart/form-data; boundary=..." for us.
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
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
};