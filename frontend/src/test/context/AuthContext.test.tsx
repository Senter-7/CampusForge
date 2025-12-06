import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';

// Mock dependencies
vi.mock('../../api/axiosClient');
vi.mock('../../utils/auth', async () => {
  const actual = await vi.importActual('../../utils/auth');
  return {
    ...actual,
    isTokenValid: vi.fn(() => false), // Default to false, override in tests
  };
});

const mockedAxiosClient = axiosClient as any;
import { isTokenValid } from '../../utils/auth';
const mockedIsTokenValid = isTokenValid as any;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('provides default auth state when not authenticated', () => {
    mockedIsTokenValid.mockReturnValue(false);
    
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('loads token from localStorage on mount', () => {
    localStorage.setItem('token', 'existing-token');
    mockedIsTokenValid.mockReturnValue(true);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.token).toBe('existing-token');
  });

  it('successfully logs in user', async () => {
    mockedIsTokenValid.mockReturnValue(true);
    const mockUser = { userId: 1, email: 'test@example.com', name: 'Test User' };
    const mockToken = 'new-token';

    mockedAxiosClient.post.mockResolvedValue({
      data: {
        token: mockToken,
        userId: 1,
        role: 'STUDENT',
        user: mockUser,
      },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.token).toBe(mockToken);
      expect(localStorage.getItem('token')).toBe(mockToken);
    });
  });

  it('throws error on failed login', async () => {
    mockedIsTokenValid.mockReturnValue(false);
    mockedAxiosClient.post.mockRejectedValue({
      response: {
        status: 401,
        data: { message: 'Invalid credentials' },
      },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await expect(
        result.current.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow();
    });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('logs out user and clears token', async () => {
    localStorage.setItem('token', 'existing-token');
    localStorage.setItem('userId', '1');

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // First login
    const mockUser = { userId: 1, email: 'test@example.com', name: 'Test User' };
    mockedAxiosClient.post.mockResolvedValue({
      data: {
        token: 'new-token',
        user: mockUser,
      },
    });

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('handles network errors during login', async () => {
    mockedIsTokenValid.mockReturnValue(false);
    mockedAxiosClient.post.mockRejectedValue({
      message: 'Network Error',
      code: 'ERR_NETWORK',
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await expect(
        result.current.login('test@example.com', 'password123')
      ).rejects.toThrow();
    });

    expect(result.current.isAuthenticated).toBe(false);
  });
});

