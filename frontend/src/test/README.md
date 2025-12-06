# Frontend Test Suite

This directory contains comprehensive tests for the CampusForge frontend application.

## Test Structure

Tests are organized to mirror the source code structure:

```
src/test/
├── components/          # Component tests
│   ├── auth/           # Authentication components
│   └── pages/          # Page components
├── context/            # Context provider tests
├── hooks/              # Custom hook tests
├── routes/             # Route protection tests
├── utils/              # Utility function tests
└── setup.ts            # Test configuration
```

## Test Categories

### ✅ Authentication Tests

#### Login Component (`components/auth/Login.test.tsx`)
Tests the login form component with comprehensive validation and interaction testing:

- **Form Rendering**: Verifies all form fields (email, password) and submit button are rendered correctly
- **Empty Email Validation**: Tests that submitting with an empty email field shows "Email is required" error
- **Invalid Email Format Validation**: Tests that entering an invalid email format (e.g., "invalid-email") shows "Please enter a valid email address" error message
- **Short Password Validation**: Tests that passwords shorter than 6 characters show validation error
- **Loading State**: Verifies that the submit button is disabled while the login request is in progress
- **Navigation Links**: Ensures the link to the registration page is present and correctly configured

#### Register Component (`components/auth/Register.test.tsx`)
Tests the user registration form with field validation:

- **Form Rendering**: Verifies all required fields are rendered (username, full name, email, password, role, university)
- **Empty Username Validation**: Tests that submitting with empty username shows "Username is required" error
- **Short Username Validation**: Tests that usernames shorter than 3 characters trigger validation error on blur
- **Invalid Username Format**: Tests that usernames with invalid characters (e.g., spaces) show "Username can only contain letters, numbers, and underscores" error
- **Invalid Email Format**: Tests email validation on blur event
- **Navigation Links**: Ensures the link to the login page is present and correctly configured

#### AuthContext (`context/AuthContext.test.tsx`)
Tests the authentication context provider and its functionality:

- **Default State**: Verifies that unauthenticated users have correct default state (isAuthenticated: false, user: null, token: null)
- **Token Loading**: Tests that valid tokens are loaded from localStorage on component mount
- **Successful Login**: Tests the complete login flow including API call, token storage, and state updates
- **Failed Login**: Tests error handling when login credentials are invalid (401 error)
- **Logout Functionality**: Verifies that logout clears token from localStorage and resets authentication state
- **Network Error Handling**: Tests graceful handling of network errors during login attempts

#### Auth Utilities (`utils/auth.test.ts`)
Tests authentication utility functions (if implemented):
- Token validation
- User ID extraction
- Role checking
- Token decoding

### ✅ Route Protection Tests

#### PrivateRoute (`routes/PrivateRoute.test.tsx`)
Tests the private route component that protects authenticated routes:

- **Authenticated Access**: Verifies that users with valid tokens can access protected content
- **Unauthenticated Redirect**: Tests that unauthenticated users are redirected to login page
- **Token Validation**: Tests that routes check token validity from localStorage
- **Expired Token Handling**: Verifies that expired tokens trigger redirect to login

#### AdminRoute (`routes/AdminRoute.test.tsx`)
Tests the admin-only route protection:

- **Admin Access**: Verifies that users with ADMIN role can access admin routes
- **Non-Admin Redirect**: Tests that non-admin users (STUDENT, PROFESSOR) are redirected to dashboard
- **Unauthenticated Redirect**: Tests that unauthenticated users are redirected to login
- **Role-Based Access Control**: Ensures proper role checking before granting access

### ✅ Hook Tests

#### useCurrentUser (`hooks/useCurrentUser.test.tsx`)
Tests the custom hook for fetching current user data:

- **Successful Data Fetching**: Tests that user data is fetched correctly from the API
- **Error Handling**: Verifies that API errors result in a placeholder user being returned
- **Null Data Handling**: Tests that null responses return placeholder user data
- **Data Transformation**: Tests that interests array is correctly transformed from objects to strings
- **Date Fallback**: Verifies that `createdAt` is used as `joinedDate` when `joinedDate` is missing
- **Loading State**: Tests that the hook correctly reports loading state during API calls

#### useNotifications (`hooks/useNotifications.test.tsx`)
Tests the notifications management hook:

- **Notification Fetching**: Tests that notifications are fetched successfully from the API
- **Unread Count Calculation**: Verifies that unread count is calculated correctly from notification array
- **Mark as Read**: Tests optimistic update when marking notifications as read
- **Delete Notification**: Tests that notifications can be deleted via API call
- **Empty State**: Tests handling of empty notifications array
- **Error Handling**: Verifies graceful handling of API errors (returns empty array)

### ✅ Page Component Tests

#### Projects Page (`components/pages/Projects.test.tsx`)
Tests the projects page component (placeholder structure):

- **Project Fetching**: Tests that projects are fetched and displayed correctly
- **Empty State**: Tests handling of empty projects list
- **Error Handling**: Tests API error handling for project fetching

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test Login.test.tsx

# Run tests with coverage
npm run test:coverage

# Run tests once (for CI/CD)
npm run test:run
```

## Test Coverage Goals

- **Critical Paths**: 80%+ coverage
  - Authentication flow
  - Route protection
  - Core utilities

- **Components**: 60%+ coverage
  - User-facing components
  - Form components
  - Interactive components

- **Hooks**: 70%+ coverage
  - Custom hooks
  - Data fetching hooks
  - State management hooks

## Writing New Tests

### Component Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '../../components/MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    // Assert expected behavior
  });
});
```

### Hook Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMyHook } from '../../hooks/useMyHook';

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

describe('useMyHook', () => {
  it('fetches data successfully', async () => {
    const { result } = renderHook(() => useMyHook(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what users see and do
   - Avoid testing internal implementation details

2. **Use Accessible Queries**
   - Prefer `getByRole`, `getByLabelText`
   - Only use `getByTestId` as last resort

3. **Test Error States**
   - Don't just test happy paths
   - Test error handling and edge cases

4. **Keep Tests Isolated**
   - Each test should be independent
   - Clean up state between tests

5. **Mock External Dependencies**
   - Mock API calls
   - Mock browser APIs (localStorage, etc.)
   - Mock third-party libraries

## Common Patterns

### Mocking API Calls

```typescript
vi.mock('../../api/axiosClient');
const mockedAxiosClient = axiosClient as any;

beforeEach(() => {
  mockedAxiosClient.get.mockResolvedValue({ data: mockData });
});
```

### Mocking React Router

```typescript
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});
```

### Testing Async Operations

```typescript
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

## Troubleshooting

See `TESTING_TROUBLESHOOTING.md` for common issues and solutions.

## Coverage Reports

After running `npm run test:coverage`, check the `coverage/` directory for detailed reports.

- `coverage/index.html` - Interactive HTML report
- `coverage/coverage-summary.json` - JSON summary

## Contributing

When adding new features:
1. Write tests first (TDD) or alongside the feature
2. Ensure tests pass before submitting PR
3. Maintain or improve coverage percentages
4. Follow the existing test patterns and structure

