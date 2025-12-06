import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivateRoute } from '../../routes/PrivateRoute';
import { AuthProvider } from '../../context/AuthContext';
import { isTokenValid } from '../../utils/auth';

// Mock dependencies
vi.mock('../../utils/auth');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate">Redirecting to {to}</div>,
  };
});

const mockedIsTokenValid = isTokenValid as any;

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

describe('PrivateRoute', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders children when user is authenticated via context', () => {
    localStorage.setItem('token', 'valid-token');
    mockedIsTokenValid.mockReturnValue(true);

    render(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    mockedIsTokenValid.mockReturnValue(false);

    render(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toBeInTheDocument();
  });

  it('allows access when token is valid in localStorage even if context is not updated', () => {
    localStorage.setItem('token', 'valid-token');
    mockedIsTokenValid.mockReturnValue(true);

    render(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects when token is expired', () => {
    localStorage.setItem('token', 'expired-token');
    mockedIsTokenValid.mockReturnValue(false);

    render(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>,
      { wrapper: createWrapper() }
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});

