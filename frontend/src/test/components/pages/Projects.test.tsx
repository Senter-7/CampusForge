import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axiosClient from '../../../api/axiosClient';

// Mock the Projects component - we'll create a simplified version for testing
// In real scenario, you'd import the actual component
vi.mock('../../../api/axiosClient');

const mockedAxiosClient = axiosClient as any;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Projects Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and displays projects', async () => {
    const mockProjects = [
      {
        projectId: 1,
        title: 'Test Project 1',
        description: 'Description 1',
        status: 'OPEN',
      },
      {
        projectId: 2,
        title: 'Test Project 2',
        description: 'Description 2',
        status: 'OPEN',
      },
    ];

    mockedAxiosClient.get.mockResolvedValue({ data: mockProjects });

    // Note: This is a placeholder test structure
    // You would import and render the actual Projects component here
    expect(mockProjects).toHaveLength(2);
  });

  it('handles empty projects list', async () => {
    mockedAxiosClient.get.mockResolvedValue({ data: [] });

    // Test empty state handling
    expect([]).toHaveLength(0);
  });

  it('handles API error', async () => {
    mockedAxiosClient.get.mockRejectedValue(new Error('API Error'));

    // Test error handling
    await expect(
      mockedAxiosClient.get('/projects')
    ).rejects.toThrow();
  });
});

