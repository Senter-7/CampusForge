import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminRoute } from '../../routes/AdminRoute';
import { AuthProvider } from '../../context/AuthContext';
import { getUserRole } from '../../utils/auth';
import { useCurrentUser } from '../../hooks/useCurrentUser';

// Mock dependencies
vi.mock('../../utils/auth', async () => {
  const actual = await vi.importActual('../../utils/auth');
  return {
    ...actual,
    isTokenValid: vi.fn(() => true),
  };
});
vi.mock('../../hooks/useCurrentUser');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate">Redirecting to {to}</div>,
  };
});

const mockedGetUserRole = getUserRole as any;
const mockedUseCurrentUser = vi.mocked(useCurrentUser);

const createWrapper = (initialEntries = ['/']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('AdminRoute', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
    // Default mock for useCurrentUser
    mockedUseCurrentUser.mockReturnValue({
      data: { role: 'ADMIN', userId: 1 },
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  it('renders children when user has ADMIN role', async () => {
    localStorage.setItem('token', 'admin-token');

    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });
  });

  it('redirects to dashboard when user is not admin', () => {
    localStorage.setItem('token', 'user-token');
    mockedUseCurrentUser.mockReturnValue({
      data: { role: 'STUDENT', userId: 1 },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    localStorage.clear();

    render(
      <AdminRoute>
        <div>Admin Content</div>
      </AdminRoute>,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });
});

