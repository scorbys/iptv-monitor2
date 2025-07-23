/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

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
  loginWithGmail: () => void;
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

  const apiCall = React.useCallback(
    async (endpoint: string, data?: Record<string, unknown>) => {
      try {
        const response = await fetch(endpoint, {
          method: data ? "POST" : "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: data ? JSON.stringify(data) : undefined,
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            if (user !== null) setUser(null);
            throw new Error("Authentication failed");
          }

          if (response.status === 502) {
            throw new Error(
              "Server temporarily unavailable. Please try again later."
            );
          }

          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        return result;
      } catch (error) {
        console.error("API call error:", error);
        throw error;
      }
    },
    [user]
  );

  // Enhanced token checking dengan fallback ke localStorage
  const getAuthToken = React.useCallback(() => {
    // Cek cookie terlebih dahulu
    const cookies = document.cookie.split(";").reduce((acc, cookie) => {
      const [key, ...rest] = cookie.trim().split("=");
      acc[key] = rest.join("=");
      return acc;
    }, {} as Record<string, string>);

    let token = cookies.token;
    
    // Jika tidak ada di cookie, cek localStorage sebagai fallback
    if (!token) {
      try {
        token = localStorage.getItem('authToken') || '';
        console.log('Token retrieved from localStorage as fallback');
      } catch (e) {
        console.warn('Could not access localStorage:', e);
      }
    }

    return token;
  }, []);

  const checkAuth = React.useCallback(async () => {
    try {
      setLoading(true);

      const token = getAuthToken();

      if (!token) {
        console.log("No auth token found in cookie or localStorage");
        if (user !== null) setUser(null);
        return;
      }

      console.log("Token found, verifying...");

      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const result = await apiCall("/api/auth/verify");

          if (result.success && result.user) {
            const userData = {
              id: result.user.userId || result.user.id,
              username: result.user.username,
              email: result.user.email,
            };
            
            setUser(userData);
            console.log("Auth check successful:", result.user.username);
            
            // Sync token ke cookie jika hanya ada di localStorage
            if (!document.cookie.includes('token=') && token) {
              console.log('Syncing token from localStorage to cookie');
              const isProduction = window.location.protocol === 'https:';
              const cookieValue = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; ${isProduction ? 'secure; samesite=none' : 'samesite=lax'}`;
              document.cookie = cookieValue;
            }
            
            return;
          } else {
            console.log("Auth check failed:", result);
            if (user !== null) setUser(null);
            return;
          }
        } catch (error) {
          retryCount++;
          console.log(`Auth check attempt ${retryCount} failed:`, error);

          if (retryCount >= maxRetries) {
            throw error;
          }
          await new Promise((resolve) =>
            setTimeout(resolve, 2000 * retryCount)
          );
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      if (user !== null) setUser(null);

      if (
        error instanceof Error &&
        !error.message.includes("Authentication failed")
      ) {
        console.log("Network error, keeping tokens");
      } else {
        // Clear invalid tokens
        document.cookie =
          "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=lax";
        try {
          localStorage.removeItem('authToken');
        } catch (e) {
          console.warn('Could not clear localStorage:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall, user, getAuthToken]);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      const result = await apiCall("/api/auth/login", {
        identifier: email,
        password: password,
      });

      if (result.success && result.user) {
        const userData = {
          id: result.user.userId || result.user.id,
          username: result.user.username,
          email: result.user.email,
        };

        setUser(userData);
        console.log("Login successful:", userData.username);

        return { success: true };
      } else {
        return { success: false, error: result.error || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Network error occurred";
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Gmail login - langsung redirect ke Google OAuth
  const loginWithGmail = () => {
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");

      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "/dashboard";
      const redirectPath =
        currentPath === "/login" || currentPath === "/register"
          ? "/dashboard"
          : currentPath;

      // Encode current URL sebagai state untuk redirect setelah login
      const frontendUrl =
        process.env.NEXT_PUBLIC_FRONTEND_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const state = encodeURIComponent(`${frontendUrl}${redirectPath}`);

      const googleAuthUrl = `${backendUrl}/api/auth/google?state=${state}`;

      console.log("Google OAuth URL:", googleAuthUrl);
      console.log("State parameter:", state);

      // Tambahkan error handling
      if (!backendUrl) {
        console.error("Backend URL not configured");
        throw new Error("Authentication service not available");
      }

      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error("Gmail login redirect error:", error);
      // Tampilkan error ke user
      alert("Failed to initiate Google login. Please try again.");
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      setLoading(true);

      if (password.length < 6) {
        return {
          success: false,
          error: "Password must be at least 6 characters long",
        };
      }

      const result = await apiCall("/api/auth/register", {
        username,
        email,
        password,
      });

      if (result.success && result.user) {
        const userData = {
          id: result.user.userId || result.user.id,
          username: result.user.username,
          email: result.user.email,
        };

        setUser(userData);
        console.log("Registration successful:", userData.username);
        return { success: true };
      } else {
        return { success: false, error: result.error || "Registration failed" };
      }
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Network error occurred";
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);

      if (user !== null) setUser(null);

      try {
        await apiCall("/api/auth/logout");
      } catch (error) {
        console.error("Logout API call failed:", error);
      }

      const clearCookie = (name: string) => {
        const cookieConfigs = [
          `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`,
          `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure`,
          `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=lax`,
          `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=none`,
          `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=lax`,
          `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=none`,
          `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${window.location.hostname}`,
          `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT`,
        ];

        cookieConfigs.forEach((config) => {
          document.cookie = config;
        });
      };

      clearCookie("token");
      clearCookie("auth-token");
      clearCookie("jwt");

      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.warn("Could not clear storage:", e);
      }

      console.log("Logout successful, redirecting...");
      window.location.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      if (user !== null) setUser(null);
    } finally {
      setLoading(false);
      window.location.replace("/login");
    }
  };

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Enhanced Google OAuth redirect handling
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const googleLoginSuccess = urlParams.get("google_login");
    const timestamp = urlParams.get("_t");

    if (googleLoginSuccess === "success") {
      console.log("Google login success detected, checking auth...");
      
      // Remove URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete("google_login");
      url.searchParams.delete("_t");
      window.history.replaceState({}, "", url.toString());

      // Delay auth check to ensure cookie is set
      setTimeout(() => {
        checkAuth();
      }, 1000);
    }
  }, [checkAuth]);

  // TAMBAHAN: Periodic auth check untuk memastikan session tetap valid
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const token = getAuthToken();
      if (!token) {
        console.log("Token not found during periodic check, logging out...");
        setUser(null);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user, getAuthToken]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    loginWithGmail,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};