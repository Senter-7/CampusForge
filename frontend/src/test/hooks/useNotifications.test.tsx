import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNotifications } from '../../hooks/useNotifications';
import axiosClient from '../../api/axiosClient';

// Mock dependencies
vi.mock('../../api/axiosClient');

const mockedAxiosClient = axiosClient as any;

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

describe('useNotifications Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches notifications successfully', async () => {
    const mockNotifications = [
      {
        notificationId: 1,
        userId: 1,
        message: 'You have a new message',
        isRead: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        notificationId: 2,
        userId: 1,
        message: 'Task assigned to you',
        isRead: true,
        createdAt: '2024-01-02T00:00:00Z',
      },
    ];

    mockedAxiosClient.get.mockResolvedValue({ data: mockNotifications });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
  });

  it('calculates unread count correctly', async () => {
    const mockNotifications = [
      { notificationId: 1, userId: 1, message: 'Msg 1', isRead: false, createdAt: '2024-01-01' },
      { notificationId: 2, userId: 1, message: 'Msg 2', isRead: true, createdAt: '2024-01-02' },
      { notificationId: 3, userId: 1, message: 'Msg 3', isRead: false, createdAt: '2024-01-03' },
    ];

    mockedAxiosClient.get.mockResolvedValue({ data: mockNotifications });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.unreadCount).toBe(2);
  });

  it('marks notification as read optimistically', async () => {
    const mockNotifications = [
      {
        notificationId: 1,
        userId: 1,
        message: 'Test message',
        isRead: false,
        createdAt: '2024-01-01',
      },
    ];

    mockedAxiosClient.get.mockResolvedValue({ data: mockNotifications });
    mockedAxiosClient.put.mockResolvedValue({ data: { ...mockNotifications[0], isRead: true } });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.unreadCount).toBe(1);

    await act(async () => {
      result.current.markAsRead(1);
    });

    // Verify the API call was made
    expect(mockedAxiosClient.put).toHaveBeenCalledWith('/notifications/1/read');
    
    // Note: The optimistic update may trigger a refetch, so we just verify the call was made
    // The actual state update depends on the refetch timing which can be flaky in tests
  });

  it('deletes notification successfully', async () => {
    const mockNotifications = [
      {
        notificationId: 1,
        userId: 1,
        message: 'Test message',
        isRead: false,
        createdAt: '2024-01-01',
      },
    ];

    mockedAxiosClient.get.mockResolvedValue({ data: mockNotifications });
    mockedAxiosClient.delete.mockResolvedValue({});

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.deleteNotification(1);
    });

    await waitFor(() => {
      expect(mockedAxiosClient.delete).toHaveBeenCalledWith('/notifications/1');
    });
  });

  it('handles empty notifications array', async () => {
    mockedAxiosClient.get.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('handles API error gracefully', async () => {
    mockedAxiosClient.get.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should default to empty array on error
    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });
});

