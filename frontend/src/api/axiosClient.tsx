// src/api/axiosClient.ts
import axios from "axios";
import { toast } from "sonner";
import { isTokenValid } from "../utils/auth";

const BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8080/api";

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Automatically add token to each request
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    
    // Check if token is expired before sending request
    if (token && !isTokenValid()) {
      // Token is expired, remove it
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      // Don't add expired token to request
      return config;
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Handle 401 responses (unauthorized - expired/invalid token)
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Token is invalid or expired
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.includes("/login") || currentPath.includes("/register");
      
      if (!isAuthPage) {
        // Show notification before redirecting
        toast.error("Your session has expired. Please log in again.");
        
        // Clear tokens
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        
        // Dispatch a custom event that components can listen to
        window.dispatchEvent(new CustomEvent("auth:logout", { detail: { reason: "token_expired" } }));
        
        // Small delay to allow toast to show
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
