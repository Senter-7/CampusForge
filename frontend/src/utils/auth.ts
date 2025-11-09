// src/utils/auth.ts
// Use a NAMED import to get the function directly
import { jwtDecode } from "jwt-decode";

export interface JwtPayload {
  sub: string;        // usually user ID
  role?: string;      // user role if present
  exp?: number;       // expiration timestamp
  [key: string]: any; // allow other fields
}

export const getToken = (): string | null => {
  return localStorage.getItem("token");
};

export const getUserId = (): string | null => {
  return localStorage.getItem("userId");
};

export const setUserId = (userId: string | number): void => {
  localStorage.setItem("userId", String(userId));
  
};

/** Decode a JWT safely */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    // Now you can call jwtDecode directly.
    // We can also pass the type for better type safety.
    return jwtDecode<JwtPayload>(token);
  } catch (err) {
  	// The error will likely be an "InvalidTokenError"
  	// You can check err.name if you want to handle it specifically
    console.error("Invalid token:", err);
    return null;
  }
};

export const getCurrentUserId = (): string | null => {
  // First try to get userId from localStorage (set during login/register)
  const storedUserId = getUserId();
  if (storedUserId) {
    
    return storedUserId;
  }

  // Fallback: try to get from token (though JWT sub contains email, not userId)
  const token = getToken();
  if (!token) return null;

  const payload = decodeToken(token);
  const userId = payload?.sub || null;
  
  return userId;
};

/**
 * Get current user's role from token
 */
export const getUserRole = (): string | null => {
  const token = getToken();
  if (!token) return null;

  const payload = decodeToken(token);
  return payload?.role || null;
};

/**
 * Check if token is valid (not expired)
 */
export const isTokenValid = (): boolean => {
  const token = getToken();
  if (!token) return false;

  const payload = decodeToken(token);
  if (!payload || !payload.exp) return false;

  // JWT exp is in seconds
  return Date.now() < payload.exp * 1000;
};

