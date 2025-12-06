import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isTokenValid } from "../utils/auth";

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  // Also check localStorage directly as fallback for immediate auth state
  // This ensures navigation works even if React state hasn't updated yet
  const token = localStorage.getItem("token");
  const tokenIsValid = token && isTokenValid();
  
  // User is authenticated if either the context says so OR token is valid in localStorage
  const authenticated = isAuthenticated || tokenIsValid;
  
  return authenticated ? <>{children}</> : <Navigate to="/login" replace />;
};
