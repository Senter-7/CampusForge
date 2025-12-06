import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import axios from "axios";
import { getUserRole } from "../../utils/auth";
import {
  useForm,
  SubmitHandler,
  ControllerRenderProps,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";

const registerSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  name: z
    .string()
    .min(1, "Full name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email is too long"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password is too long"),
  skills: z.string().optional(),
  interests: z.string().optional(),
  role: z.enum(["STUDENT", "PROFESSOR", "ADMIN"], {
    message: "Please select a role",
  }),
  universityId: z.string().min(1, "Please select a university"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface University {
  universityId: number;
  name: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
}

export function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [creatingUniversity, setCreatingUniversity] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      skills: "",
      interests: "",
      role: "STUDENT",
      universityId: "",
    },
  });

  // Helper function to extract meaningful error message
  const getErrorMessage = (error: unknown, context: string = "operation"): string => {
    if (axios.isAxiosError(error)) {
      // Network error (no response received)
      if (!error.response) {
        return `Unable to connect to the server. Please check your internet connection and try again.`;
      }

      const status = error.response.status;
      const data = error.response.data;

      // Handle specific HTTP status codes
      switch (status) {
        case 400:
          // Check for validation errors in the response
          if (data?.errors) {
            const errorMessages = Object.values(data.errors).flat();
            return errorMessages.join(", ") || "Invalid request. Please check your input.";
          }
          return data?.message || "Invalid request. Please check your input.";
        case 401:
          return data?.message || "Authentication failed. Please try again.";
        case 403:
          return "Access denied. Please contact support if you believe this is an error.";
        case 409:
          // Conflict - likely duplicate email/username
          if (data?.message?.toLowerCase().includes("email")) {
            return "This email is already registered. Please use a different email or try logging in.";
          }
          if (data?.message?.toLowerCase().includes("username")) {
            return "This username is already taken. Please choose a different username.";
          }
          return data?.message || "A conflict occurred. This email or username may already be in use.";
        case 404:
          return "Service not found. Please try again later.";
        case 429:
          return "Too many requests. Please wait a moment and try again.";
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
      return error.message || `An unexpected error occurred during ${context}. Please try again.`;
    }

    return `An unexpected error occurred during ${context}. Please try again.`;
  };

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const res = await axiosClient.get("/universities");
        setUniversities(res.data);
      } catch (err) {
        console.error("Failed to fetch universities:", err);
        const errorMessage = getErrorMessage(err, "loading universities");
        toast.error(errorMessage);
      } finally {
        setLoadingUniversities(false);
      }
    };

    fetchUniversities();
  }, []);

  const handleCreateUniversity = async (universityName: string) => {
    setCreatingUniversity(true);
    try {
      const res = await axiosClient.post("/universities", {
        name: universityName,
      });
      const newUniversity = res.data;
      setUniversities((prev) => [...prev, newUniversity]);
      // Set the newly created university as selected
      form.setValue("universityId", String(newUniversity.universityId));
      toast.success(`University "${universityName}" created successfully`);
      return newUniversity;
    } catch (err) {
      const errorMessage = getErrorMessage(err, "creating university");
      toast.error(errorMessage);
      throw err;
    } finally {
      setCreatingUniversity(false);
    }
  };

  const universityOptions = universities.map((university) => ({
    value: String(university.universityId),
    label: university.name,
  }));

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    setLoading(true);
    try {
      const registerData = {
        ...data,
        universityId: data.universityId ? Number(data.universityId) : null,
      };
      
      const res = await axiosClient.post("/auth/register", registerData);
      const { userId } = res.data;
      
      if (userId) {
        localStorage.setItem("userId", String(userId));
      }
      
      toast.success("Registration successful! Logging you in...", {
        duration: 2000,
      });
      
      // Small delay to show the success message
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Attempt to auto-login after registration
      try {
        await login(data.email, data.password);
        
        // Get user role from token to determine where to redirect
        const userRole = getUserRole();
        const isAdmin = userRole === "ADMIN";
        
        const dashboardPath = isAdmin ? "/admin/dashboard" : "/dashboard";
        const dashboardName = isAdmin ? "admin dashboard" : "dashboard";
        
        toast.success(`Welcome! Redirecting to your ${dashboardName}...`, {
          duration: 2000,
        });
        // Small delay to allow user to see the success message
        setTimeout(() => {
          navigate(dashboardPath, { replace: true });
        }, 800);
      } catch (loginError) {
        // Registration succeeded but login failed
        const loginErrorMessage = getErrorMessage(loginError, "automatic login");
        toast.warning(`Account created successfully, but ${loginErrorMessage}. Please log in manually.`, {
          duration: 4000,
        });
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, "registration");
      toast.error(errorMessage);
      console.error("Registration error:", err);
      
      // Clear sensitive fields on error
      form.setValue("password", "");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 rounded-xl border p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-center">
          Create your account
        </h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }: { field: ControllerRenderProps<RegisterFormValues, "username"> }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. jdoe_student" 
                      {...field} 
                      disabled={loading || loadingUniversities}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: ControllerRenderProps<RegisterFormValues, "name"> }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Jane Doe" 
                      {...field} 
                      disabled={loading || loadingUniversities}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
               render={({ field }: { field: ControllerRenderProps<RegisterFormValues, "email"> }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="name@university.edu" 
                      {...field} 
                      disabled={loading || loadingUniversities}
                      autoComplete="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
               render={({ field }: { field: ControllerRenderProps<RegisterFormValues, "password"> }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      {...field} 
                      disabled={loading || loadingUniversities}
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="skills"
               render={({ field }: { field: ControllerRenderProps<RegisterFormValues, "skills"> }) => (
                <FormItem>
                  <FormLabel>Skills</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Java, React, ML" 
                      {...field} 
                      disabled={loading || loadingUniversities}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interests"
              render={({ field }: { field: ControllerRenderProps<RegisterFormValues, "interests"> }) => (
                <FormItem>
                  <FormLabel>Interests</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. AI, Web Development" 
                      {...field} 
                      disabled={loading || loadingUniversities}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }: { field: ControllerRenderProps<RegisterFormValues, "role"> }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loading || loadingUniversities}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="universityId"
              render={({ field }: { field: ControllerRenderProps<RegisterFormValues, "universityId"> }) => (
                <FormItem>
                  <FormLabel>University</FormLabel>
                  <FormControl>
                    <Combobox
                      options={universityOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={loadingUniversities ? "Loading universities..." : "Search or select university"}
                      searchPlaceholder="Search universities..."
                      emptyText="No university found."
                      createText="Create university"
                      onCreateNew={handleCreateUniversity}
                      disabled={loading || loadingUniversities || creatingUniversity}
                    />
                  </FormControl>
                  <FormDescription>
                    Type to search or create a new university if it doesn't exist
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || loadingUniversities}
            >
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>
        </Form>

        <p className="text-sm text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
