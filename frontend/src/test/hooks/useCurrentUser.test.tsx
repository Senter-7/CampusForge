import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import axiosClient from '../../api/axiosClient';
import { getCurrentUserId } from '../../utils/auth';

// Mock dependencies
vi.mock('../../api/axiosClient');
vi.mock('../../utils/auth');

const mockedAxiosClient = axiosClient as any;
const mockedGetCurrentUserId = getCurrentUserId as any;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCurrentUser Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetCurrentUserId.mockReturnValue('1');
  });

  it('fetches current user successfully', async () => {
    const mockUser = {
      userId: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'STUDENT',
      major: 'Computer Science',
    };

    mockedAxiosClient.get.mockResolvedValue({ data: mockUser });

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toMatchObject({
      name: 'Test User',
      email: 'test@example.com',
    });
    expect(mockedAxiosClient.get).toHaveBeenCalledWith('/users/1');
  });

  it('returns placeholder user when API fails', async () => {
    mockedAxiosClient.get.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should return placeholder user on error
    expect(result.current.data?.name).toBe('John Doe');
    expect(result.current.data?.email).toBe('john.doe@university.edu');
  });

  it('returns placeholder user when no data', async () => {
    mockedAxiosClient.get.mockResolvedValue({ data: null });

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.name).toBe('John Doe');
  });

  it('transforms interests from objects to strings', async () => {
    const mockUser = {
      userId: 1,
      name: 'Test User',
      interests: [
        { interestId: 1, name: 'Machine Learning' },
        { interestId: 2, name: 'Web Development' },
      ],
    };

    mockedAxiosClient.get.mockResolvedValue({ data: mockUser });

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.interests).toEqual([
      'Machine Learning',
      'Web Development',
    ]);
  });

  it('uses createdAt as joinedDate if joinedDate is missing', async () => {
    const mockUser = {
      userId: 1,
      name: 'Test User',
      createdAt: '2023-01-01',
    };

    mockedAxiosClient.get.mockResolvedValue({ data: mockUser });

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.joinedDate).toBe('2023-01-01');
  });

  it('handles loading state', () => {
    mockedAxiosClient.get.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });
});

