"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const apiCall = React.useCallback(
    async (endpoint: string, data?: Record<string, unknown>) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 detik timeout
      
      try {
        // Pastikan endpoint format yang benar
        const url = endpoint.startsWith("http") ? endpoint : endpoint;

        console.log(`Making API call to: ${url}`);

        const response = await fetch(url, {
          method: data ? "POST" : "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: data ? JSON.stringify(data) : undefined,
          credentials: "include",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        
        console.log(`API Response status: ${response.status}`);

        // Handle different HTTP status codes
        if (response.status === 408) {
          throw new Error("Request timeout. Please try again.");
        }

        if (response.status === 401 || response.status === 403) {
          setUser(null);
          throw new Error("Authentication failed");
        }

        if (response.status === 502) {
          throw new Error("Server is temporarily unavailable. Please try again.");
        }

        if (response.status === 500) {
          throw new Error("Internal server error. Please try again later.");
        }

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            errorMessage = `Server error (${response.status})`;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log("API Response:", result);
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error("Request timeout. Please try again.");
        }
        
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error("Network error. Please check your connection.");
        }
        
        console.error("API call error:", error);
        throw error;
      }
    },
    []
  );

  const checkAuth = React.useCallback(async () => {
    try {
      setLoading(true);

      // Cek apakah ada cookie token terlebih dahulu
      const hasCookie = document.cookie.includes("token=");
      if (!hasCookie) {
        console.log("No auth cookie found");
        setUser(null);
        setLoading(false);
        return;
      }

      // Tambahkan retry logic untuk check auth
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount < maxRetries) {
        try {
          const result = await apiCall("/api/auth/verify");

          if (result.success && result.user) {
            setUser({
              id: result.user.userId || result.user.id,
              username: result.user.username,
              email: result.user.email,
            });
            console.log("Auth check successful:", result.user.username);
            return;
          } else {
            console.log("Auth check failed:", result);
            setUser(null);
            return;
          }
        } catch (error) {
          console.error(`Auth check attempt ${retryCount + 1} failed:`, error);
          retryCount++;
          
          if (retryCount < maxRetries) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Auth check failed after retries:", error);
      setUser(null);

      // Clear cookie jika verification gagal
      if (error instanceof Error && !error.message.includes("Network error")) {
        document.cookie =
          "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Login function dengan improved error handling
  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login with:", { email });

      const result = await apiCall("/api/auth/login", {
        identifier: email,
        password: password,
      });

      console.log("Login result:", result);

      if (result.success && result.user) {
        setUser({
          id: result.user.userId,
          username: result.user.username,
          email: result.user.email,
        });

        // Force refresh auth state setelah login dengan delay
        setTimeout(() => {
          checkAuth();
        }, 500);

        return { success: true };
      } else {
        return { success: false, error: result.error || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Login failed";
      
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage = "Login request timed out. Please try again.";
        } else if (error.message.includes("Network error")) {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.message.includes("502")) {
          errorMessage = "Server is temporarily unavailable. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Register function dengan improved error handling
  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      console.log("Attempting registration with:", { username, email });

      const result = await apiCall("/api/auth/register", {
        username,
        email,
        password,
      });

      console.log("Registration result:", result);

      if (result.success && result.user) {
        setUser({
          id: result.user.userId,
          username: result.user.username,
          email: result.user.email,
        });
        return { success: true };
      } else {
        return { success: false, error: result.error || "Registration failed" };
      }
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Registration failed";
      
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage = "Registration request timed out. Please try again.";
        } else if (error.message.includes("Network error")) {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.message.includes("502")) {
          errorMessage = "Server is temporarily unavailable. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Logout function dengan improved error handling
  const logout = async () => {
    try {
      await apiCall("/api/auth/logout");
    } catch (error) {
      console.error("Logout API call failed:", error);
      // Continue with logout even if API call fails
    } finally {
      setUser(null);
      // Clear cookie di client side
      document.cookie =
        "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      router.push("/login");
    }
  };

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
