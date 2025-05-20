
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Form schema validation
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(5, { message: "Password must be at least 5 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      console.log("Submitting login form with email:", data.email);
      // Always login as NGO role
      await login(data.email, data.password, 'ngo');
      toast.success("Login successful! Redirecting to dashboard...");
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login failed. Please check your credentials and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-green-800">Login</h2>
          <p className="mt-2 text-sm text-green-600">
            Sign in to access your NGO account
          </p>
        </div>

        <Card className="overflow-hidden rounded-xl border border-green-100 shadow-lg">
          <div className="flex justify-center p-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <User className="h-10 w-10 text-green-600" />
            </div>
          </div>
          
          <CardContent className="space-y-6 p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            placeholder="Email ID"
                            className="pl-10 border-green-200 focus:border-green-500"
                          />
                          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-green-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            className="pl-10 pr-10 border-green-200 focus:border-green-500"
                          />
                          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-green-400" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-sm text-green-600 hover:text-green-500">
                    Forgot Password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                  disabled={isLoading || authLoading}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </Form>

            <div className="text-center text-sm">
              <p className="text-gray-600">
                New User?{" "}
                <Link to="/register" className="font-medium text-green-600 hover:text-green-500">
                  Signup
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
