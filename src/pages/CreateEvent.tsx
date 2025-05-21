
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Calendar, Link as LinkIcon, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { toast } from "sonner";

// Define the correct API URL
const API_URL = "https://api.aiapplabs.io";

// Schema for form validation
const eventSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  startDate: z.string().min(1, { message: "Start date is required" }),
  endDate: z.string().min(1, { message: "End date is required" }),
  url: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  location: z.string().min(1, { message: "Location is required" }),
}).refine((data) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate >= startDate;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function CreateEvent() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      url: "",
      location: "",
    },
  });

  // Track form changes
  useEffect(() => {
    const subscription = form.watch(() => {
      setIsDirty(true);
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Handle page leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Function to format date for input field
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  // Function to handle form submission
  async function onSubmit(values: EventFormValues) {
    setIsLoading(true);
    try {
      // Format dates to DD/MM/YYYY as required by the API
      const formatDateForAPI = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      const eventData = {
        title: values.title,
        description: values.description,
        startDate: formatDateForAPI(values.startDate),
        endDate: formatDateForAPI(values.endDate),
        url: values.url || null,
        location: values.location,
      };

      // Log request details
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      };

      console.log("Request details:", {
        url: `${API_URL}/api/event/ngo/create`,
        method: "POST",
        headers: {
          ...headers,
          "Authorization": "Bearer [REDACTED]" // Don't log the actual token
        },
        body: eventData
      });

      // Use XMLHttpRequest for better timeout and error handling
      const response = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.open("POST", `${API_URL}/api/event/ngo/create`, true);
        
        // Set headers
        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
        
        // Set timeout to 30 seconds
        xhr.timeout = 30000;
        
        xhr.onload = function() {
          if (this.status >= 200 && this.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve({ ok: true, status: this.status, data });
            } catch (e) {
              reject(new Error("Invalid JSON response"));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.message || `HTTP error! status: ${this.status}`));
            } catch (e) {
              reject(new Error(`HTTP error! status: ${this.status}`));
            }
          }
        };
        
        xhr.ontimeout = function() {
          reject(new Error("Request timed out - server might be busy. Please try again later."));
        };
        
        xhr.onerror = function() {
          reject(new Error("Network error occurred. Please check your connection."));
        };
        
        xhr.send(JSON.stringify(eventData));
      });

      if (response.ok) {
        console.log("API response:", response.data);
        // Show success toast
        toast.success("Event created successfully!");
        // On success, navigate to events page
        navigate("/dashboard", { state: { eventCreated: true } });
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error: any) {
      console.error("Error creating event:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast.error(`Failed to create event: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link to="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-green-800">Create Opportunity</h1>
          <p className="text-gray-500">Create a new volunteer opportunity for your organization</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm relative">
          {isLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <div className="rounded-lg bg-white p-4 shadow-lg">
                <p className="text-green-800">Creating event...</p>
              </div>
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-800">Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your event/opportunity name" {...field} />
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
                    <FormLabel className="text-green-800">Event Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the volunteer opportunity"
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date fields in a grid */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Start Date */}
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-green-800">Start Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="date"
                            placeholder="Select start date"
                            {...field}
                            min={formatDateForInput(new Date())}
                            max={formatDateForInput(new Date(new Date().setFullYear(new Date().getFullYear() + 1)))}
                          />
                          <Calendar className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* End Date */}
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-green-800">End Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="date"
                            placeholder="Select end date"
                            {...field}
                            min={form.watch("startDate") || formatDateForInput(new Date())}
                            max={formatDateForInput(new Date(new Date().setFullYear(new Date().getFullYear() + 1)))}
                          />
                          <Calendar className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-800">Location</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="Event location" {...field} className="pl-10" />
                        <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-green-600" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* External URL */}
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-green-800">External URL (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="https://example.com" 
                          {...field} 
                          className="pl-10"
                          onChange={(e) => {
                            const value = e.target.value.trim();
                            field.onChange(value || "");
                          }}
                        />
                        <LinkIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-green-600" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-green-700 text-white hover:bg-green-800"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create Opportunity"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </DashboardLayout>
  );
}
