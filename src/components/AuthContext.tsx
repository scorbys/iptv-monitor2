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

  // Detect mobile browser
  const isMobile = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }, []);

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

  // Enhanced token checking dengan mobile optimization
  const getAuthToken = React.useCallback(() => {
    console.log("Getting auth token...");

    // Enhanced cookie parsing untuk mobile dengan manual parsing
    const cookieString = document.cookie;
    console.log("Raw cookie string:", cookieString);

    // Manual cookie parsing yang lebih reliable untuk mobile
    const cookies = cookieString.split(";").reduce((acc, cookie) => {
      const [key, ...rest] = cookie.trim().split("=");
      if (key && rest.length > 0) {
        acc[key] = decodeURIComponent(rest.join("="));
      }
      return acc;
    }, {} as Record<string, string>);

    console.log("Parsed cookies:", Object.keys(cookies));

    // Priority order untuk mobile compatibility
    let token =
      cookies.token ||
      cookies["auth-token"] ||
      cookies.jwt ||
      cookies.authToken ||
      cookies["token"] ||
      cookies["auth-token"];

    console.log("Token from cookies:", !!token);

    // Jika tidak ada di cookie, cek localStorage sebagai fallback (terutama untuk mobile)
    if (!token) {
      try {
        const storageKeys = ["authToken", "token", "auth-token"];
        for (const key of storageKeys) {
          const storedToken = localStorage.getItem(key);
          if (storedToken && storedToken.length > 20) {
            // Basic validation
            token = storedToken;
            console.log(`Token retrieved from localStorage key: ${key}`);

            // Sync token back to cookie jika ditemukan di localStorage
            const isProduction = window.location.protocol === "https:";
            const cookieConfig = `token=${token}; path=/; max-age=${
              7 * 24 * 60 * 60
            }; ${isProduction ? "secure; samesite=none" : "samesite=lax"}`;
            document.cookie = cookieConfig;
            console.log("Token synced from localStorage to cookie");
            break;
          }
        }
      } catch (e) {
        console.warn("Could not access localStorage:", e);
      }
    }

    if (token) {
      console.log("Final token preview:", token.substring(0, 20) + "...");
    } else {
      console.log("No token found anywhere");
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
      const maxRetries = isMobile ? 2 : 3; // Fewer retries on mobile for better UX

      while (retryCount < maxRetries) {
        try {
          const result = await apiCall("/api/auth/verify");

          if (result.success && result.user) {
            // Konsistensi format user data
            const userData = {
              id: result.user.userId || result.user.id,
              username: result.user.username,
              email: result.user.email,
            };

            console.log("Setting user data:", userData); // Debug log
            setUser(userData);
            console.log("Auth check successful:", result.user.username);

            // MOBILE OPTIMIZATION: Sync token ke cookie jika hanya ada di localStorage
            if (
              (!document.cookie.includes("token=") ||
                !document.cookie.includes("auth-token=")) &&
              token
            ) {
              console.log(
                "Syncing token from localStorage to cookie (mobile optimization)"
              );
              const isProduction = window.location.protocol === "https:";

              // Set multiple cookie formats for better compatibility
              const cookieConfigs = [
                `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; ${
                  isProduction ? "secure; samesite=none" : "samesite=lax"
                }`,
                `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; ${
                  isProduction ? "secure; samesite=none" : "samesite=lax"
                }`,
              ];

              cookieConfigs.forEach((config) => {
                document.cookie = config;
              });
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

          // Shorter retry delay for mobile
          const retryDelay = isMobile ? 1500 * retryCount : 2000 * retryCount;
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
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
        console.log("Clearing invalid tokens");

        // Clear cookie with multiple configurations for mobile compatibility
        const cookieConfigs = [
          "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=none",
          "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=lax",
          "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT",
          "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=none",
          "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=lax",
          "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT",
        ];

        cookieConfigs.forEach((config) => {
          document.cookie = config;
        });

        try {
          localStorage.removeItem("authToken");
          localStorage.removeItem("token");
          localStorage.removeItem("auth-token");
        } catch (e) {
          console.warn("Could not clear localStorage:", e);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall, user, getAuthToken, isMobile]);

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
      console.log("Is mobile device:", isMobile);

      // Tambahkan error handling
      if (!backendUrl) {
        console.error("Backend URL not configured");
        throw new Error("Authentication service not available");
      }

      // MOBILE OPTIMIZATION: Use window.location.replace for mobile for better UX
      if (isMobile) {
        console.log("Using mobile-optimized redirect");
        window.location.replace(googleAuthUrl);
      } else {
        window.location.href = googleAuthUrl;
      }
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

      // Enhanced cookie clearing for mobile
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

      // Mobile-optimized redirect
      if (isMobile) {
        window.location.replace("/login");
      } else {
        window.location.replace("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
      if (user !== null) setUser(null);
    } finally {
      setLoading(false);
      if (isMobile) {
        window.location.replace("/login");
      } else {
        window.location.replace("/login");
      }
    }
  };

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Enhanced Google OAuth redirect handling dengan mobile optimization
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const googleLoginSuccess = urlParams.get("google_login");
    const refreshParam = urlParams.get("_refresh");

    if (googleLoginSuccess === "success") {
      console.log("Google login success detected, checking auth...");
      console.log("Is mobile device:", isMobile);
      console.log("Refresh param:", refreshParam);

      // Remove URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete("google_login");
      url.searchParams.delete("_t");
      url.searchParams.delete("_refresh");
      window.history.replaceState({}, "", url.toString());

      // Extended delay untuk mobile dengan multiple checks
      const performAuthCheck = async () => {
        let attempts = 0;
        const maxAttempts = isMobile ? 5 : 3;

        while (attempts < maxAttempts) {
          console.log(`Auth check attempt ${attempts + 1}/${maxAttempts}`);

          const token = getAuthToken();
          if (token) {
            console.log("Token found, performing auth check");
            await checkAuth();
            return;
          }

          attempts++;
          if (attempts < maxAttempts) {
            const delay = isMobile ? 1000 * attempts : 500 * attempts;
            console.log(`No token found, retrying in ${delay}ms`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }

        console.log("No token found after all attempts, something went wrong");
        // Redirect back to login if no token found
        if (isMobile) {
          window.location.replace("/login?error=token_not_found");
        }
      };

      // Initial delay untuk ensure cookie is set
      const initialDelay = isMobile ? 2500 : 1500;
      setTimeout(performAuthCheck, initialDelay);
    }
  }, [checkAuth, isMobile, getAuthToken]);

  // OPTIMIZED: Periodic auth check dengan mobile consideration
  useEffect(() => {
    if (!user) return;

    // Longer interval for mobile to save battery
    const checkInterval = isMobile ? 120000 : 60000; // 2 minutes on mobile, 1 minute on desktop

    const interval = setInterval(() => {
      const token = getAuthToken();
      if (!token) {
        console.log("Token not found during periodic check, logging out...");
        setUser(null);
      }
    }, checkInterval);

    return () => clearInterval(interval);
  }, [user, getAuthToken, isMobile]);

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