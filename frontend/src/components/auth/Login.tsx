import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import { toast } from "sonner";
import { useForm, ControllerRenderProps } from "react-hook-form";
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

type LoginFormValues = {
  email: string;
  password: string;
};

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const form = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  });

  const { handleSubmit, control } = form;

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data.email, data.password);
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 rounded-xl border p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-center">Welcome back</h1>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={control}
              name="email"
              render={({ field }: { field: ControllerRenderProps<LoginFormValues, "email"> }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter your email" {...field} />
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Login
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
