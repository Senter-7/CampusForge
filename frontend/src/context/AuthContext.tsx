// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";
import axios from "axios";
import { isTokenValid } from "../utils/auth";

interface AuthContextType {
  user: any;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const queryClient = useQueryClient();

  // Check token validity on mount and periodically
  useEffect(() => {
    const checkTokenValidity = () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken && !isTokenValid()) {
        // Token is expired, clear it
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        queryClient.clear();
      } else if (storedToken && isTokenValid()) {
        setToken(storedToken);
      }
    };

    // Check immediately
    checkTokenValidity();

    // Listen for logout events from axios interceptor
    const handleLogout = () => {
      setToken(null);
      setUser(null);
      queryClient.clear();
    };

    window.addEventListener("auth:logout", handleLogout);

    // Check token validity every minute
    const interval = setInterval(checkTokenValidity, 60000);

    return () => {
      window.removeEventListener("auth:logout", handleLogout);
      clearInterval(interval);
    };
  }, [queryClient]);

  useEffect(() => {
    if (token) {
      try {
        localStorage.setItem("token", token);
      } catch (error) {
        console.error("Failed to save token to localStorage:", error);
        // If localStorage is full or unavailable, clear old items or handle gracefully
        setToken(null);
      }
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await axiosClient.post("/auth/login", { email, password });
      const { token: newToken, role, message, userId } = res.data;
      
      if (!newToken) {
        throw new Error("No token received from server");
      }

      // Save token to localStorage immediately (synchronously) before updating state
      // This ensures PrivateRoute can check localStorage even if React state hasn't updated yet
      try {
        localStorage.setItem("token", newToken);
        if (userId) {
          localStorage.setItem("userId", String(userId));
        }
      } catch (error) {
        console.error("Failed to save to localStorage:", error);
        throw new Error("Failed to save authentication data. Please try again.");
      }

      // Update state after localStorage is set
      setToken(newToken);
      setUser({ email, role, message, userId });
    } catch (error) {
      // Re-throw the error so components can handle it appropriately
      if (axios.isAxiosError(error)) {
        // Preserve the axios error structure for better error handling in components
        throw error;
      }
      // Wrap non-axios errors
      throw new Error(
        error instanceof Error ? error.message : "An unexpected error occurred during login"
      );
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("userId");
    queryClient.clear();
  };

  // Check if user is authenticated with a valid token
  const isAuthenticated = token !== null && isTokenValid();

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
