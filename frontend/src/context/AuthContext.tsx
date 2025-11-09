// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axiosClient from "../api/axiosClient";

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

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await axiosClient.post("/auth/login", { email, password });
    const { token, role, message, userId } = res.data;
    console.log("Login response - User ID:", userId);
    setToken(token);
    setUser({ email, role, message, userId });
    if (userId) {
      localStorage.setItem("userId", String(userId));
      console.log("User ID stored in localStorage:", userId);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("userId");
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
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
