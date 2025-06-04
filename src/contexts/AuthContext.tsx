
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

// Define types for our authentication context
interface User {
  uuid: string;
  email: string;
  first?: string;
  last?: string;
  role: "ngo" | "user" | "admin";
  verified: boolean;
  avatar?: string;
  additionalInfo?: {
    establishementYear?: string;
    description?: string;
    organizationType?: string;
    [key: string]: any;
  };
  phone?: string;
  gender?: string;
  dob?: string;
  address?: {
    id: number;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    userId: number;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: "ngo" | "user") => Promise<void>;
  register: (email: string, password: string, role: "ngo" | "user") => Promise<void>;
  logout: () => void;
  updateUserProfile: (userData: Partial<User>) => Promise<void>;
  updateAddress: (addressData: any) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
}

const API_URL = "https://api.aiapplabs.io"; // Updated to the correct API URL

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem("auth_token"),
    isAuthenticated: false,
    isLoading: true,
  });

  // Effect to check token and load user data on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.log('No token found, setting auth state to unauthenticated');
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        console.log('Loading user data with token...');
        const response = await fetchWithRetry(`${API_URL}/api/user/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Successfully loaded user data:', data);
          
          // Check if the response has a nested user object
          const userData = data.user || data;
          
          setAuthState({
            user: userData,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          console.error('Failed to fetch user data:', response.status);
          // Token invalid, clear storage
          localStorage.removeItem("auth_token");
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error: any) {
        console.error("Failed to load user:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadUser();
  }, []);

  // Register function
  const register = async (email: string, password: string, role: "ngo" | "user") => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      toast.success("Registration successful! Please verify your email.");
      return;
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
      throw error;
    }
  };

  // Login function
  const login = async (email: string, password: string, role: "ngo" | "user") => {
    try {
      console.log('Attempting login for:', email);
      
      // Login API call
      const response = await fetchWithRetry(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Login API error:', error);
        throw new Error(error.message || "Login failed");
      }

      const data = await response.json();
      console.log('Login successful, token received');
      localStorage.setItem("auth_token", data.token);

      // Fetch user data with the new token
      console.log('Fetching user data...');
      const userResponse = await fetchWithRetry(`${API_URL}/api/user/me`, {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });

      if (!userResponse.ok) {
        console.error('Failed to fetch user data:', userResponse.status);
        throw new Error("Failed to fetch user data");
      }

      const userData = await userResponse.json();
      console.log('User data fetched successfully:', userData);

      // Extract user data from the response (it might be nested under 'user')
      const user = userData.user || userData;

      // Update auth state
      setAuthState({
        user: user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      toast.success("Login successful!");
    } catch (error: any) {
      console.error("Login error:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      toast.error(error.message || "Login failed");
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("auth_token");
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    toast.info("You have been logged out");
  };

  // Update user profile with retry logic
  const updateUserProfile = async (userData: Partial<User>) => {
    try {
      if (!authState.token) throw new Error("Not authenticated");
      
      console.log('Updating user profile with data:', userData);
      console.log('Using token:', authState.token);
      
      const response = await fetchWithRetry(`${API_URL}/api/user/me`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${authState.token}`
        },
        body: JSON.stringify(userData),
      });

      console.log('Profile update response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Profile update error:', error);
        throw new Error(error.message || "Failed to update profile");
      }

      const data = await response.json();
      console.log('Profile update successful:', data);
      
      // Extract user data from the response (it might be nested under 'user')
      const updatedUser = data.user || data;
      
      setAuthState(prev => ({
        ...prev,
        user: {
          ...prev.user!,
          ...updatedUser
        }
      }));

      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || "Failed to update profile");
      throw error;
    }
  };

  // Update address with retry logic
  const updateAddress = async (addressData: any) => {
    try {
      if (!authState.token) throw new Error("Not authenticated");
      
      console.log('Updating address with data:', addressData);
      console.log('Using token:', authState.token);
      
      const response = await fetchWithRetry(`${API_URL}/api/user/address/update`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${authState.token}`
        },
        body: JSON.stringify(addressData),
      });

      console.log('Address update response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Address update error:', error);
        throw new Error(error.message || "Failed to update address");
      }

      console.log('Address update successful');
      toast.success("Address updated successfully");
    } catch (error: any) {
      console.error('Address update error:', error);
      toast.error(error.message || "Failed to update address");
      throw error;
    }
  };

  // Verify OTP
  const verifyOtp = async (email: string, otp: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to verify OTP");
      }

      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
        
        // Fetch user data with the new token
        const userResponse = await fetch(`${API_URL}/api/user/me`, {
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await userResponse.json();

        setAuthState({
          user: userData,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
        });
      }
      
      toast.success("Email verified successfully!");
    } catch (error: any) {
      toast.error(error.message || "OTP verification failed");
      throw error;
    }
  };

  // Resend OTP
  const resendOtp = async (email: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/otp/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to resend OTP");
      }

      toast.success("OTP sent to your email");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend OTP");
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      register,
      logout,
      updateUserProfile,
      updateAddress,
      verifyOtp,
      resendOtp,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
