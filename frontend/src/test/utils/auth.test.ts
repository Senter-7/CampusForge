import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getToken,
  getUserId,
  setUserId,
  decodeToken,
  getCurrentUserId,
  getUserRole,
  isTokenValid,
  JwtPayload,
} from '../../utils/auth';

// Mock jwt-decode
vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn(),
}));

import { jwtDecode } from 'jwt-decode';

describe('Auth Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getToken', () => {
    it('returns null when no token in localStorage', () => {
      expect(getToken()).toBeNull();
    });

    it('returns token from localStorage', () => {
      localStorage.setItem('token', 'test-token');
      expect(getToken()).toBe('test-token');
    });
  });

  describe('getUserId', () => {
    it('returns null when no userId in localStorage', () => {
      expect(getUserId()).toBeNull();
    });

    it('returns userId from localStorage', () => {
      localStorage.setItem('userId', '123');
      expect(getUserId()).toBe('123');
    });
  });

  describe('setUserId', () => {
    it('stores userId as string in localStorage', () => {
      setUserId(123);
      expect(localStorage.getItem('userId')).toBe('123');
    });

    it('converts number to string', () => {
      setUserId(456);
      expect(localStorage.getItem('userId')).toBe('456');
    });
  });

  describe('decodeToken', () => {
    it('returns decoded payload for valid token', () => {
      const mockPayload: JwtPayload = {
        sub: 'user@example.com',
        role: 'STUDENT',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      vi.mocked(jwtDecode).mockReturnValue(mockPayload);

      const result = decodeToken('valid-token');
      expect(result).toEqual(mockPayload);
      expect(jwtDecode).toHaveBeenCalledWith('valid-token');
    });

    it('returns null for invalid token', () => {
      vi.mocked(jwtDecode).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = decodeToken('invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('getCurrentUserId', () => {
    it('returns userId from localStorage if available', () => {
      localStorage.setItem('userId', '123');
      expect(getCurrentUserId()).toBe('123');
    });

    it('falls back to token sub when userId not in localStorage', () => {
      const mockPayload: JwtPayload = {
        sub: 'user@example.com',
      };
      localStorage.setItem('token', 'test-token');
      vi.mocked(jwtDecode).mockReturnValue(mockPayload);

      const result = getCurrentUserId();
      expect(result).toBe('user@example.com');
    });

    it('returns null when no userId or token', () => {
      expect(getCurrentUserId()).toBeNull();
    });
  });

  describe('getUserRole', () => {
    it('returns role from token', () => {
      const mockPayload: JwtPayload = {
        sub: 'user@example.com',
        role: 'ADMIN',
      };
      localStorage.setItem('token', 'test-token');
      vi.mocked(jwtDecode).mockReturnValue(mockPayload);

      expect(getUserRole()).toBe('ADMIN');
    });

    it('returns null when no token', () => {
      expect(getUserRole()).toBeNull();
    });

    it('returns null when token has no role', () => {
      const mockPayload: JwtPayload = {
        sub: 'user@example.com',
      };
      localStorage.setItem('token', 'test-token');
      vi.mocked(jwtDecode).mockReturnValue(mockPayload);

      expect(getUserRole()).toBeNull();
    });
  });

  describe('isTokenValid', () => {
    it('returns true for valid non-expired token', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const mockPayload: JwtPayload = {
        sub: 'user@example.com',
        exp: futureExp,
      };
      localStorage.setItem('token', 'test-token');
      vi.mocked(jwtDecode).mockReturnValue(mockPayload);

      expect(isTokenValid()).toBe(true);
    });

    it('returns false for expired token', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const mockPayload: JwtPayload = {
        sub: 'user@example.com',
        exp: pastExp,
      };
      localStorage.setItem('token', 'test-token');
      vi.mocked(jwtDecode).mockReturnValue(mockPayload);

      expect(isTokenValid()).toBe(false);
    });

    it('returns false when no token', () => {
      expect(isTokenValid()).toBe(false);
    });

    it('returns false when token has no exp', () => {
      const mockPayload: JwtPayload = {
        sub: 'user@example.com',
      };
      localStorage.setItem('token', 'test-token');
      vi.mocked(jwtDecode).mockReturnValue(mockPayload);

      expect(isTokenValid()).toBe(false);
    });
  });
});

