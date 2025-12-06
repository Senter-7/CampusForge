import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { getUserRole } from "../../utils/auth";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Helper function to extract meaningful error message
const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // Network error (no response received)
    if (!error.response) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }

    const status = error.response.status;
    const data = error.response.data;

    // Handle specific HTTP status codes
    switch (status) {
      case 400:
        return data?.message || "Invalid request. Please check your input.";
      case 401:
        return data?.message || "Invalid email or password. Please try again.";
      case 403:
        return "Access denied. Please contact support if you believe this is an error.";
      case 404:
        return "Service not found. Please try again later.";
      case 429:
        return "Too many login attempts. Please wait a moment and try again.";
      case 500:
        return "Server error. Please try again later or contact support.";
      case 503:
        return "Service temporarily unavailable. Please try again later.";
      default:
        return data?.message || `An error occurred (${status}). Please try again.`;
    }
  }

  // Generic error
  if (error instanceof Error) {
    return error.message || "An unexpected error occurred. Please try again.";
  }

  return "An unexpected error occurred. Please try again.";
};

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    reValidateMode: "onBlur",
    shouldFocusError: true,
    criteriaMode: "all",
    defaultValues: { email: "", password: "" },
  });

  const { handleSubmit, control } = form;

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      
      // Verify token is in localStorage before navigating
      // This ensures the auth state is properly set
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token not saved. Please try again.");
      }
      
      // Get user role from token to determine where to redirect
      const userRole = getUserRole();
      const isAdmin = userRole === "ADMIN";
      
      const dashboardPath = isAdmin ? "/admin/dashboard" : "/dashboard";
      const dashboardName = isAdmin ? "Admin dashboard" : "dashboard";
      
      toast.success(`Login successful! Redirecting to your ${dashboardName}...`, {
        duration: 2000,
      });
      
      // Small delay to allow user to see the success message and ensure state updates
      // Use a slightly longer delay to ensure React state has updated
      setTimeout(() => {
        navigate(dashboardPath, { replace: true });
      }, 800);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      toast.error(errorMessage);
      console.error("Login error:", err);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 rounded-xl border p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-center">Welcome back</h1>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={control}
              name="email"
              render={({ field }: { field: ControllerRenderProps<LoginFormValues, "email"> }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Enter your email" 
                      {...field} 
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="password"
              render={({ field }: { field: ControllerRenderProps<LoginFormValues, "password"> }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      {...field}
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Form>
        <p className="text-sm text-center">
          Don’t have an account?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
