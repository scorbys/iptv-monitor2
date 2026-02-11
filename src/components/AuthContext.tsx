/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

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
  const hasCheckedRef = useRef(false);

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
        throw error;
      }
    },
    [user]
  );

  // Token checking dengan mobile optimization
  const getAuthToken = React.useCallback(() => {
    // Cek semua possible cookie names
    const cookies = document.cookie.split(";").reduce((acc, cookie) => {
      const [key, ...rest] = cookie.trim().split("=");
      if (key) acc[key] = rest.join("=");
      return acc;
    }, {} as Record<string, string>);

    // Check multiple cookie names untuk compatibility
    let token =
      cookies.token ||
      cookies["auth-token"] ||
      cookies.authToken ||
      cookies["token-fallback"] ||
      cookies["session-token"] ||
      cookies.jwt;


    // Jika tidak ada di cookie, cek localStorage
    if (!token) {
      try {
        token =
          localStorage.getItem("authToken") ||
          localStorage.getItem("token") ||
          localStorage.getItem("auth-token") ||
          localStorage.getItem("session-token") ||
          localStorage.getItem("jwt") ||
          "";

        if (token) {

          // SYNC: Set token ke cookie jika ditemukan di localStorage
          const isProduction = window.location.protocol === "https:";
          const cookieValue = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60
            }; ${isProduction ? "secure; samesite=none" : "samesite=lax"}`;
          document.cookie = cookieValue;
        }
      } catch (e) {
      }
    }

    // Fallback dari URL
    if (!token) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get("temp_token");
      if (urlToken) {
        token = urlToken;
        localStorage.setItem("authToken", token);
        const isProduction = window.location.protocol === "https:";
        const cookieValue = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60
          }; ${isProduction ? "secure; samesite=none" : "samesite=lax"}`;
        document.cookie = cookieValue;
        console.log(
          "Token extracted from URL and synced to cookie/localStorage"
        );
      }
    }

    return token;
  }, []);

  const checkAuth = React.useCallback(async () => {
    try {
      setLoading(true);

      const token = getAuthToken();

      if (!token) {
        if (user !== null) setUser(null);
        return;
      }


      let retryCount = 0;
      const maxRetries = isMobile ? 2 : 3; // Fewer retries on mobile for better UX

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

            // MOBILE OPTIMIZATION: Sync token ke cookie jika hanya ada di localStorage
            if (!document.cookie.includes("token=") && token) {
              console.log(
                "Syncing token from localStorage to cookie (mobile optimization)"
              );
              const isProduction = window.location.protocol === "https:";

              // Mobile-friendly cookie setting
              let cookieValue;
              if (isMobile) {
                cookieValue = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60
                  }; ${isProduction ? "secure; samesite=none" : "samesite=lax"}`;
              } else {
                cookieValue = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60
                  }; ${isProduction ? "secure; samesite=none" : "samesite=lax"}`;
              }

              document.cookie = cookieValue;
            }

            return;
          } else {
            if (user !== null) setUser(null);
            return;
          }
        } catch (error) {
          retryCount++;

          if (retryCount >= maxRetries) {
            throw error;
          }

          // Shorter retry delay for mobile
          const retryDelay = isMobile ? 1000 * retryCount : 2000 * retryCount;
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
      } else {
        // Clear invalid tokens

        // Clear cookie with multiple configurations for mobile compatibility
        const cookieConfigs = [
          "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=none",
          "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=lax",
          "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT",
        ];

        cookieConfigs.forEach((config) => {
          document.cookie = config;
        });

        try {
          localStorage.removeItem("authToken");
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

        return { success: true };
      } else {
        return { success: false, error: result.error || "Login failed" };
      }
    } catch (error) {
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
      // Use NEXT_PUBLIC_API_URL instead of NEXT_PUBLIC_API_BASE_URL
      const backendUrl = process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");

      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "/dashboard";
      const redirectPath =
        currentPath === "/login" || currentPath === "/register"
          ? "/dashboard"
          : currentPath;

      // Build frontend URL for state parameter
      const frontendUrl =
        typeof window !== "undefined" ? window.location.origin : "";
      const state = encodeURIComponent(`${frontendUrl}${redirectPath}`);

      // Use relative path since we're using Next.js rewrites
      const googleAuthUrl = `/api/auth/google?state=${state}`;

      console.log("Initiating Google OAuth login:", {
        backendUrl,
        redirectPath,
        state,
        googleAuthUrl
      });

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
      // Tampilkan error ke user
      console.error("Google login initiation error:", error);
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
        return { success: true };
      } else {
        return { success: false, error: result.error || "Registration failed" };
      }
    } catch (error) {
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
      }

      // Cookie clearing for mobile
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
    if (!hasCheckedRef.current) {
      hasCheckedRef.current = true;
      checkAuth();
    }
  }, [checkAuth]);

  // Google OAuth redirect handling dengan mobile optimization
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const googleLoginSuccess = urlParams.get("google_login");
    const timestamp = urlParams.get("_t");
    const tempToken = urlParams.get("temp_token");

    if (googleLoginSuccess === "success" || tempToken) {
      console.log("Google OAuth callback detected:", {
        googleLoginSuccess,
        hasTempToken: !!tempToken,
        isMobile
      });

      // Handle temp_token from URL (mobile fallback)
      if (tempToken) {
        try {
          const decodedToken = decodeURIComponent(tempToken);
          localStorage.setItem("authToken", decodedToken);
          console.log("Token extracted from URL and saved to localStorage");
        } catch (e) {
          console.error("Failed to decode temp_token:", e);
        }
      }

      // Remove URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete("google_login");
      url.searchParams.delete("_t");
      url.searchParams.delete("temp_token");
      window.history.replaceState({}, "", url.toString());

      // Mobile-optimized delay untuk ensure cookie is set
      const authCheckDelay = isMobile ? 2000 : 1000;

      setTimeout(() => {
        console.log("Triggering auth check after OAuth callback");
        checkAuth();
      }, authCheckDelay);
    }
  }, [checkAuth, isMobile]);

  // Periodic auth check dengan mobile consideration
  useEffect(() => {
    if (!user) return;

    // Longer interval for mobile to save battery
    const checkInterval = isMobile ? 120000 : 60000; // 2 minutes on mobile, 1 minute on desktop

    const interval = setInterval(async () => {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
      } else {
        // Tambahkan verify token secara periodik
        try {
          const result = await apiCall("/api/auth/verify");
          if (!result.success || !result.user) {
            setUser(null);
            // Clear invalid tokens
            const cookieConfigs = [
              "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=none",
              "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=lax",
              "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT",
            ];
            cookieConfigs.forEach((config) => {
              document.cookie = config;
            });
            try {
              localStorage.removeItem("authToken");
            } catch (e) {
              console.warn("Could not clear localStorage:", e);
            }
          }
        } catch (error) {
          // Jangan logout jika hanya network error
          if (error instanceof Error && !error.message.includes("Authentication failed")) {
          } else {
            setUser(null);
          }
        }
      }
    }, checkInterval);

    return () => clearInterval(interval);
  }, [user, getAuthToken, isMobile, apiCall]);

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