
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/components/layouts/DashboardLayout';

// Define the API URL
const API_URL = "https://api.aiapplabs.io";

// Add retry logic with CORS headers
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3) => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      if (response.status === 504) {
        throw new Error('Gateway timeout - server is taking too long to respond');
      }

      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      // Wait for 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

// Years for the establishment dropdown
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

// Form schema validation
const ngoProfileSchema = z.object({
  first: z.string().min(2, { message: "Organization name is required" }),
  phone: z.string().min(10, { message: "Valid phone number is required" }),
  establishementYear: z.string().min(4, { message: "Year is required" }),
  description: z.string().min(10, { message: "Description is required" }),
  organizationType: z.string().min(2, { message: "Organization type is required" }),
  street: z.string().min(1, { message: "Street is required" }),
  city: z.string().min(1, { message: "City is required" }),
  state: z.string().min(1, { message: "State is required" }),
  zipCode: z.string().min(5, { message: "Zip code is required" }),
  country: z.string().min(1, { message: "Country is required" }),
});

type NGOProfileFormValues = z.infer<typeof ngoProfileSchema>;

export default function NGOProfile() {
  const navigate = useNavigate();
  const { updateUserProfile, updateAddress, user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<NGOProfileFormValues>({
    resolver: zodResolver(ngoProfileSchema),
    defaultValues: {
      first: '',
      phone: '',
      establishementYear: '',
      description: '',
      organizationType: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
    },
  });

  // Fill the form with user data when it becomes available
  useEffect(() => {
    if (user) {
      console.log('Setting form values from user data:', user);
      
      form.reset({
        first: user.first || '',
        phone: user.phone || '',
        establishementYear: user.additionalInfo?.establishementYear || '',
        description: user.additionalInfo?.description || '',
        organizationType: user.additionalInfo?.organizationType || '',
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        zipCode: user.address?.zipCode || '',
        country: user.address?.country || 'India',
      });
      
      setIsFetching(false);
    }
  }, [user, form]);

  async function onSubmit(data: NGOProfileFormValues) {
    setIsLoading(true);
    try {
      // First update the user profile
      await updateUserProfile({
        first: data.first,
        phone: data.phone,
        additionalInfo: {
          establishementYear: data.establishementYear,
          description: data.description,
          organizationType: data.organizationType,
        }
      });
      
      // Then update the address
      await updateAddress({
        street: data.street,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
      });

      toast.success('Profile updated successfully');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  }

  const renderProfileForm = () => (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">NGO Details</h2>
          <p className="mt-2 text-sm text-gray-600">
            Complete your organization profile
          </p>
        </div>

        <Card className="overflow-hidden rounded-xl border shadow-lg">
          <CardContent className="p-8">
            {isFetching ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Organization Name */}
                  <FormField
                    control={form.control}
                    name="first"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Organization Name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone Number */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Phone Number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Year of Establishment */}
                  <FormField
                    control={form.control}
                    name="establishementYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year of Establishment</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-80">
                            {years.map((year) => (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Organization Type */}
                  <FormField
                    control={form.control}
                    name="organizationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Type</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Organization Type (e.g., Nonprofit, Foundation)" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Tell us about your organization"
                            className="min-h-[120px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2">
                    {/* Street */}
                    <FormField
                      control={form.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Street Address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* City */}
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="City" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* State */}
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="State" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Zip Code */}
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Postal Code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Country */}
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Country" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      className="w-full bg-green-600 text-white hover:bg-green-700"
                      disabled={isLoading}
                    >
                      {isLoading ? "Saving..." : "Update Profile"}
                    </Button>
                  </div>
                  
                  <div className="text-center text-xs text-gray-500">
                    <p>
                      We use your personal data to improve delivery of volunteer link services. You can learn more in our Terms of Use and Privacy Policy.
                    </p>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      {renderProfileForm()}
    </DashboardLayout>
  );
}
