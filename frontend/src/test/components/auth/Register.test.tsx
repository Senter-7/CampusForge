import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Register } from '../../../components/auth/Register';
import { AuthProvider } from '../../../context/AuthContext';
import axiosClient from '../../../api/axiosClient';

// Mock dependencies
vi.mock('../../../api/axiosClient');
vi.mock('../../../utils/auth');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

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
      <AuthProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Register Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockedAxiosClient.get.mockResolvedValue({ data: [] }); // Mock universities fetch
  });

  it('renders registration form with all required fields', async () => {
    render(<Register />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/university/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for empty username', async () => {
    const user = userEvent.setup();
    render(<Register />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for short username', async () => {
    const user = userEvent.setup();
    render(<Register />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/username/i);
    await user.type(usernameInput, 'ab');
    await user.tab(); // Trigger blur to show validation

    await waitFor(() => {
      expect(screen.getByText(/Username must be at least 3 characters/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid username format', async () => {
    const user = userEvent.setup();
    render(<Register />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/username/i);
    await user.type(usernameInput, 'user name'); // Space not allowed
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(screen.getByText(/Username can only contain letters, numbers, and underscores/i)).toBeInTheDocument();
    });
  });

  // Note: Register component doesn't have confirm password field
  // This test is removed as it doesn't match the actual component

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();
    render(<Register />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('shows link to login page', () => {
    render(<Register />, { wrapper: createWrapper() });

    const loginLink = screen.getByRole('link', { name: /login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute('href', '/login');
  });
});

