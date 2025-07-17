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
      try {
        // Pastikan base URL konsisten
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL;
        const url = endpoint.startsWith("/")
          ? `${baseUrl}${endpoint}`
          : `${baseUrl}/${endpoint}`;

        const response = await fetch(url, {
          method: data ? "POST" : "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: data ? JSON.stringify(data) : undefined,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
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

      // Cek cookie dengan cara yang lebih robust
      const hasCookie = document.cookie
        .split(";")
        .some(
          (cookie) =>
            cookie.trim().startsWith("token=") && cookie.trim().length > 6
        );

      if (!hasCookie) {
        console.log("No auth cookie found");
        setUser(null);
        return;
      }

      const result = await apiCall("/api/auth/verify");

      if (result.success && result.user) {
        setUser({
          id: result.user.userId || result.user.id,
          username: result.user.username,
          email: result.user.email,
        });
        console.log("Auth check successful:", result.user.username);
      } else {
        console.log("Auth check failed:", result);
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);

      // Jika error bukan karena network, clear cookie
      if (error instanceof Error && !error.message.includes("fetch")) {
        // Clear cookie di client side jika verification gagal
        document.cookie =
          "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // Login function yang lebih robust
  const login = async (email: string, password: string) => {
    try {
      const result = await apiCall("/api/auth/login", {
        identifier: email,
        password: password,
      });

      console.log("Login response:", result); // DEBUG LOG

      if (result.success && result.user) {
        const userId = result.user.userId || result.user.id;
        const username = result.user.username;
        const userEmail = result.user.email;

        if (!userId || !username || !userEmail) {
          console.warn("Login response missing required fields", result.user);
          return {
            success: false,
            error: "Invalid user data received from server",
          };
        }

        setUser({
          id: userId,
          username: username,
          email: userEmail,
        });

        return { success: true };
      } else {
        console.warn("Login failed:", result);
        return {
          success: false,
          error: result.error || "Login failed",
        };
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Network error occurred";
      return { success: false, error: errorMessage };
    }
  };

  // Register function yang lebih robust
  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      const result = await apiCall("/api/auth/register", {
        username,
        email,
        password,
      });

      console.log("Register response:", result); // DEBUG LOG

      if (result.success && result.user) {
        const userId = result.user.userId || result.user.id;
        const userEmail = result.user.email;
        const userName = result.user.username;

        if (!userId || !userName || !userEmail) {
          console.warn(
            "Registration response missing required fields",
            result.user
          );
          return {
            success: false,
            error: "Invalid user data received from server",
          };
        }

        setUser({
          id: userId,
          username: userName,
          email: userEmail,
        });

        return { success: true };
      } else {
        console.warn("Registration failed:", result);
        return {
          success: false,
          error: result.error || "Registration failed",
        };
      }
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Network error occurred";
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiCall("/api/auth/logout");
    } catch (error) {
      console.error("Logout API call failed:", error);
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
