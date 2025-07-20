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
  loginWithGmail: () => Promise<{ success: boolean; error?: string }>;
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

        // Perbaikan: Cek response.ok terlebih dahulu
        if (!response.ok) {
          // Handle 401/403 khusus
          if (response.status === 401 || response.status === 403) {
            setUser(null);
            throw new Error("Authentication failed");
          }

          // Handle 502 Bad Gateway
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
    []
  );

  const checkAuth = React.useCallback(async () => {
    try {
      setLoading(true);

      // Cek cookie dengan cara yang lebih reliable
      const cookies = document.cookie.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      if (!cookies.token) {
        console.log("No auth token found");
        setUser(null);
        return;
      }

      console.log("Token found, verifying..."); // Debug log

      // Tambahkan retry logic dengan delay yang lebih lama
      let retryCount = 0;
      const maxRetries = 3;

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
          retryCount++;
          console.log(`Auth check attempt ${retryCount} failed:`, error);

          if (retryCount >= maxRetries) {
            throw error;
          }
          // Wait before retry dengan delay yang lebih lama
          await new Promise((resolve) =>
            setTimeout(resolve, 2000 * retryCount)
          );
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);

      // Jangan clear cookie jika error adalah network error
      if (
        error instanceof Error &&
        !error.message.includes("Authentication failed")
      ) {
        console.log("Network error, keeping cookie");
      } else {
        document.cookie =
          "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=lax";
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true); // Tambahkan loading state

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

  const loginWithGmail = async () => {
    try {
      setLoading(true);

      // Calculate popup position to center it
      const left = window.screenX + (window.outerWidth - 500) / 2;
      const top = window.screenY + (window.outerHeight - 600) / 2;

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

      console.log("Opening popup to:", `${backendUrl}/api/auth/google`);
      console.log("Current origin:", window.location.origin);

      const popup = window.open(
        `${backendUrl}/api/auth/google`,
        "google-login",
        `width=500,height=600,left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        throw new Error("Popup blocked. Please allow popups for this site.");
      }

      return new Promise<{ success: boolean; error?: string }>((resolve) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener("message", messageHandler);
            resolve({ success: false, error: "Login cancelled" });
          }
        }, 1000);

        const messageHandler = (event: MessageEvent) => {
          // Be more specific about allowed origins
          const allowedOrigins = [
            "https://iptv-monitor-backend-production.up.railway.app",
            "http://localhost:3001",
            "http://localhost:3000",
            window.location.origin, // Tambahkan ini untuk same-origin
          ];

          if (!allowedOrigins.includes(event.origin)) {
            console.warn(
              "Received message from unauthorized origin:",
              event.origin
            );
            return;
          }

          console.log("Received message:", event.data); // Debug log

          if (event.data.type === "GOOGLE_LOGIN_SUCCESS") {
            clearInterval(checkClosed);
            popup.close();
            window.removeEventListener("message", messageHandler);

            // Set user data
            const userData = {
              id: event.data.user.userId || event.data.user.id,
              username: event.data.user.username,
              email: event.data.user.email,
            };

            setUser(userData);
            console.log("Google login successful:", userData.username);

            // Tambahkan delay lebih lama untuk memastikan cookie terset
            setTimeout(() => {
              checkAuth();
            }, 500);

            resolve({ success: true });
          } else if (event.data.type === "GOOGLE_LOGIN_ERROR") {
            clearInterval(checkClosed);
            popup.close();
            window.removeEventListener("message", messageHandler);
            console.error("Google login error:", event.data.error);
            resolve({
              success: false,
              error: event.data.error || "Google login failed",
            });
          }
        };

        window.addEventListener("message", messageHandler);

        // Fallback timeout
        setTimeout(() => {
          if (!popup.closed) {
            clearInterval(checkClosed);
            popup.close();
            window.removeEventListener("message", messageHandler);
            resolve({ success: false, error: "Login timeout" });
          }
        }, 30000); // 30 second timeout
      });
    } catch (error) {
      console.error("Gmail login error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Gmail login failed";
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      setLoading(true);

      // Validasi password di frontend juga
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
      await apiCall("/api/auth/logout");
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      setUser(null);
      setLoading(false);

      // Clear cookie dengan cara yang lebih reliable
      document.cookie =
        "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=lax";
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
    loginWithGmail,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
