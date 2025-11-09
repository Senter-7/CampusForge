import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

import {
  useForm,
  SubmitHandler,
  Controller,ControllerRenderProps
} from "react-hook-form";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface RegisterFormValues {
  username: string;
  name: string;
  email: string;
  password: string;
  skills: string;
  interests: string;
  role: string;
  universityId: string;
}

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

  const form = useForm<RegisterFormValues>({
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

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const res = await axiosClient.get("/universities");
        setUniversities(res.data);
      } catch (err) {
        console.error("Failed to fetch universities:", err);
        toast.error("Failed to load universities");
      } finally {
        setLoadingUniversities(false);
      }
    };

    fetchUniversities();
  }, []);

  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    setLoading(true);
    try {
      const registerData = {
        ...data,
        universityId: data.universityId ? Number(data.universityId) : null,
      };
      const res = await axiosClient.post("/auth/register", registerData);
      const { userId } = res.data;
      console.log("Registration response - User ID:", userId);
      if (userId) {
        localStorage.setItem("userId", String(userId));
        console.log("User ID stored in localStorage:", userId);
      }
      toast.success("Registration successful! Logging you in...");
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Registration failed. Try again."
      );
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
                    <Input placeholder="e.g. jdoe_student" {...field} />
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
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
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
                    <Input type="email" placeholder="name@university.edu" {...field} />
                  </FormControl>
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
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
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
                    <Input placeholder="e.g. Java, React, ML" {...field} />
                  </FormControl>
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
                    <Input placeholder="e.g. AI, Web Development" {...field} />
                  </FormControl>
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
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="universityId"
              render={({ field }: { field: ControllerRenderProps<RegisterFormValues, "universityId"> }) => (
                <FormItem>
                  <FormLabel>University</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loadingUniversities}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingUniversities ? "Loading universities..." : "Select university"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {universities.map((university) => (
                        <SelectItem key={university.universityId} value={String(university.universityId)}>
                          {university.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={loading}>
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
