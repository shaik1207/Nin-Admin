const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem("authToken");

  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Parse the JSON immediately to extract the actual backend error message
    const data = await response.json().catch(() => ({}));

    // CRITICAL FIX: Only trigger the auto-logout refresh if it is a protected route.
    // We explicitly ignore routes containing '/auth/' so login errors can display normally.
    const isAuthRoute = endpoint.includes('/auth/');

    if (response.status === 401 && !isAuthRoute) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("adminAuth"); 
      localStorage.removeItem("userName");
      sessionStorage.removeItem("hasSeenWelcome");
      
      window.location.href = "/"; 
      throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok) {
      // Throws the exact error from your backend (e.g., "Incorrect password")
      throw new Error(data.message || "Something went wrong processing your request");
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error(`API Network Error [${endpoint}]: Connection refused or dropped.`);
      throw new Error("Network connection lost. Please check your internet connection.");
    }

    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
};