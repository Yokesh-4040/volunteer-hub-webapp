
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';

// Form schema validation
const otpSchema = z.object({
  otp: z.string().length(4, { message: "OTP must be 4 digits" }).regex(/^\d+$/, { message: "OTP must contain only numbers" }),
});

type OTPFormValues = z.infer<typeof otpSchema>;

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const email = location.state?.email || '';

  // Form setup
  const form = useForm<OTPFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  // Handle OTP submission
  async function onSubmit(data: OTPFormValues) {
    if (!email) {
      navigate('/register');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(email, data.otp);
      navigate('/ngo-profile');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle OTP resend
  const handleResendOTP = async () => {
    if (!email || resendDisabled) return;
    
    try {
      await resendOtp(email);
      setResendDisabled(true);
      setCountdown(60);
    } catch (error) {
      console.error(error);
    }
  };

  // Countdown timer for resend button
  useEffect(() => {
    if (!resendDisabled) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [resendDisabled]);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Verify Your Email</h2>
          <p className="mt-2 text-sm text-gray-600">
            We sent a verification code to <span className="font-medium">{email}</span>
          </p>
        </div>

        <Card className="overflow-hidden rounded-xl border shadow-lg">
          <CardContent className="space-y-6 p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            placeholder="Enter 4-digit OTP"
                            className="pl-10 text-center text-lg tracking-widest"
                            maxLength={4}
                          />
                          <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify"}
                </Button>
              </form>
            </Form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the code?{" "}
                <button 
                  onClick={handleResendOTP}
                  disabled={resendDisabled}
                  className={`font-medium ${resendDisabled ? 'text-gray-400' : 'text-green-600 hover:text-green-500'}`}
                >
                  {resendDisabled ? `Resend in ${countdown}s` : 'Resend'}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
