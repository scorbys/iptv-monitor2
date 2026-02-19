/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

interface User {
  id: string;
  username: string;
  email: string;
  role?: 'admin' | 'guest';  // Tambahkan role
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
  const oauthHandledRef = useRef(false);

  // Detect mobile browser
  const isMobile = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }, []);

  // Token checking dengan mobile optimization
  const getAuthToken = React.useCallback(() => {
    // CRITICAL FIX: In production cross-domain scenario, httpOnly cookies are NOT accessible via JavaScript
    // We MUST rely on localStorage and Authorization header instead
    // Priority: localStorage > URL params > cookies (for cross-domain compatibility)

    let token = null;

    // FIRST: Check localStorage (highest priority for cross-domain)
    try {
      token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("auth-token") ||
        localStorage.getItem("session-token") ||
        localStorage.getItem("jwt") ||
        null;

      if (token) {
        console.log("✅ [getAuthToken] Token found in localStorage");
        return token;
      }
    } catch (e) {
      console.warn("Could not access localStorage:", e);
    }

    // SECOND: Check URL params (for OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("temp_token");
    if (urlToken) {
      console.log("✅ [getAuthToken] Token found in URL params");
      try {
        const decodedToken = decodeURIComponent(urlToken);
        localStorage.setItem("authToken", decodedToken);
        return decodedToken;
      } catch (e) {
        console.error("Failed to decode URL token:", e);
      }
    }

    // THIRD: Check cookies (as fallback - will NOT work for httpOnly cookies in cross-domain)
    try {
      const cookies = document.cookie.split(";").reduce((acc, cookie) => {
        const [key, ...rest] = cookie.trim().split("=");
        if (key) acc[key] = rest.join("=");
        return acc;
      }, {} as Record<string, string>);

      token =
        cookies.token ||
        cookies["auth-token"] ||
        cookies.authToken ||
        cookies["token-fallback"] ||
        cookies["session-token"] ||
        cookies.jwt ||
        null;

      if (token) {
        console.log("✅ [getAuthToken] Token found in cookies (non-httpOnly)");
        // Sync to localStorage for consistency
        localStorage.setItem("authToken", token);
        return token;
      }
    } catch (e) {
      console.warn("Could not access cookies:", e);
    }

    console.log("❌ [getAuthToken] No token found in any storage");
    return null;
  }, []);

  const apiCall = React.useCallback(
    async (endpoint: string, data?: Record<string, unknown>, token?: string) => {
      try {
        // Build full URL to backend if endpoint is relative
        let url = endpoint;
        if (endpoint.startsWith("/")) {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL ||
            process.env.NEXT_PUBLIC_API_BASE_URL ||
            (typeof window !== "undefined" ? window.location.origin : "");
          url = `${backendUrl}${endpoint}`;
        }

        // Get token if not provided
        const authToken = token || getAuthToken();

        console.log("🔑 [apiCall] Request details:", {
          endpoint,
          url,
          hasToken: !!authToken,
          tokenLength: authToken?.length,
          tokenPreview: authToken ? `${authToken.substring(0, 20)}...${authToken.substring(authToken.length - 20)}` : 'none'
        });

        // Build headers with Authorization if token exists
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
        };

        if (authToken) {
          headers["Authorization"] = `Bearer ${authToken}`;
        }

        console.log("📤 [apiCall] Request headers:", {
          "Content-Type": headers["Content-Type"],
          "Accept": headers["Accept"],
          "Authorization": headers["Authorization"] ? `Bearer ${authToken?.substring(0, 20)}...` : 'none',
          "credentials": "include"
        });

        const response = await fetch(url, {
          method: data ? "POST" : "GET",
          headers,
          body: data ? JSON.stringify(data) : undefined,
          credentials: "include",
        });

        console.log("📥 [apiCall] Response:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
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
        console.log("📦 [apiCall] Response data:", result);
        return result;
      } catch (error) {
        throw error;
      }
    },
    [user]
  );

  const checkAuth = React.useCallback(async () => {
    try {
      setLoading(true);

      // FIRST: Check if we have temp_token in URL (just redirected from Google OAuth)
      const urlParams = new URLSearchParams(window.location.search);
      const tempToken = urlParams.get("temp_token");
      const googleLoginSuccess = urlParams.get("google_login");

      console.log("🔍 [checkAuth] URL Parameters check:", {
        currentUrl: window.location.href,
        hasTempToken: !!tempToken,
        googleLoginSuccess,
        allParams: Object.fromEntries(urlParams)
      });

      if (tempToken && googleLoginSuccess === "success") {
        console.log("✅ Found temp_token in URL, extracting and storing...");

        try {
          const decodedToken = decodeURIComponent(tempToken);
          localStorage.setItem("authToken", decodedToken);

          // Remove URL parameters
          const url = new URL(window.location.href);
          url.searchParams.delete("google_login");
          url.searchParams.delete("_t");
          url.searchParams.delete("temp_token");
          window.history.replaceState({}, "", url.toString());

          // Use this token for verification
          const result = await apiCall("/api/auth/verify", undefined, decodedToken);

          if (result.success && result.user) {
            const userData = {
              id: result.user.userId || result.user.id,
              username: result.user.username,
              email: result.user.email,
              role: result.user.role || 'guest',  // Tambahkan role
            };
            setUser(userData);

            // Save user to localStorage
            try {
              localStorage.setItem('user', JSON.stringify(userData));
              console.log("✅ User saved to localStorage (temp_token):", userData);
            } catch (e) {
              console.warn("Could not save user to localStorage:", e);
            }

            console.log("✅ User authenticated via temp_token");
            return;
          }
        } catch (error) {
          console.error("Failed to verify temp_token:", error);
        }
      }

      // SECOND: Check if we have token in localStorage/cookie
      const token = getAuthToken();

      if (!token) {
        console.log("No token found, user not authenticated");
        if (user !== null) setUser(null);
        setLoading(false);
        return;
      }

      // Helper function for dynamic cookie domain
      const getCookieDomain = () => {
        if (typeof window === "undefined") return "";
        const isProduction = window.location.protocol === "https:";
        if (!isProduction) return "";
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        if (hostname.endsWith('.vercel.app') && parts.length > 2) return "";
        if (hostname.endsWith('.vercel.app') && parts.length === 2) return ".vercel.app";
        if (parts.length >= 2) return `.${parts.slice(-2).join('.')}`;
        return "";
      };

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
              role: result.user.role || 'guest',  // Add role
            };

            setUser(userData);

            // Save user to localStorage
            try {
              localStorage.setItem('user', JSON.stringify(userData));
              console.log("✅ User saved to localStorage (verify):", userData);
            } catch (e) {
              console.warn("Could not save user to localStorage:", e);
            }

            // MOBILE OPTIMIZATION: Sync token ke cookie jika hanya ada di localStorage
            if (!document.cookie.includes("token=") && token) {
              console.log(
                "Syncing token from localStorage to cookie (mobile optimization)"
              );
              const isProduction = window.location.protocol === "https:";
              const domain = getCookieDomain();
              const secure = isProduction ? "secure;" : "";

              // Cookie setting yang sama untuk mobile dan desktop
              const cookieValue = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60
                  }; ${secure}${isProduction ? ` samesite=none; domain=${domain}` : "samesite=lax"}`;

              document.cookie = cookieValue;
            }

            return;
          } else {
            if (user !== null) setUser(null);
            setLoading(false);
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

      console.log("🔑 [Login] API result:", result);

      if (result.success && result.user) {
        const userData = {
          id: result.user.userId || result.user.id,
          username: result.user.username,
          email: result.user.email,
          role: result.user.role || 'guest',  // Tambahkan role
        };

        console.log("✅ [Login] Setting user state:", userData);
        setUser(userData);

        // CRITICAL FIX: Save user to localStorage for persistence
        try {
          localStorage.setItem('user', JSON.stringify(userData));
          console.log("✅ [Login] User saved to localStorage:", userData);
        } catch (e) {
          console.warn("Could not save user to localStorage:", e);
        }

        // CRITICAL FIX: Save token to localStorage and cookie after successful login
        if (result.token) {
          console.log("🔑 [Login] Saving token to storage...");

          // Helper function for dynamic cookie domain
          const getCookieDomain = () => {
            if (typeof window === "undefined") return "";
            const isProduction = window.location.protocol === "https:";
            if (!isProduction) return "";
            const hostname = window.location.hostname;
            const parts = hostname.split('.');
            if (hostname.endsWith('.vercel.app') && parts.length > 2) return "";
            if (hostname.endsWith('.vercel.app') && parts.length === 2) return ".vercel.app";
            if (parts.length >= 2) return `.${parts.slice(-2).join('.')}`;
            return "";
          };

          const isProduction = window.location.protocol === "https:";
          const domain = getCookieDomain();

          // Save to localStorage
          localStorage.setItem("authToken", result.token);

          // Save to cookie
          const cookieValue = `token=${result.token}; path=/; max-age=${7 * 24 * 60 * 60
            }; ${isProduction ? `secure; samesite=none; domain=${domain}` : "samesite=lax"}`;
          document.cookie = cookieValue;

          console.log("✅ [Login] Token saved successfully");
        } else {
          console.warn("⚠️ [Login] No token in response, user may not be fully authenticated");
        }

        return { success: true };
      } else {
        console.error("❌ [Login] Login failed:", result);
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
      // Use NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_BASE_URL
      const backendUrl = process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_API_BASE_URL ||
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

      // Use full URL to backend for Google OAuth
      const googleAuthUrl = `${backendUrl}/api/auth/google?state=${state}`;

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
          role: result.user.role || 'guest',  // Tambahkan role
        };

        setUser(userData);

        // Save user to localStorage
        try {
          localStorage.setItem('user', JSON.stringify(userData));
          console.log("✅ User saved to localStorage (register):", userData);
        } catch (e) {
          console.warn("Could not save user to localStorage:", e);
        }

        // CRITICAL FIX: Save token to localStorage and cookie after successful registration
        if (result.token) {
          console.log("🔑 [Register] Saving token to storage...");

          // Helper function for dynamic cookie domain
          const getCookieDomain = () => {
            if (typeof window === "undefined") return "";
            const isProduction = window.location.protocol === "https:";
            if (!isProduction) return "";
            const hostname = window.location.hostname;
            const parts = hostname.split('.');
            if (hostname.endsWith('.vercel.app') && parts.length > 2) return "";
            if (hostname.endsWith('.vercel.app') && parts.length === 2) return ".vercel.app";
            if (parts.length >= 2) return `.${parts.slice(-2).join('.')}`;
            return "";
          };

          const isProduction = window.location.protocol === "https:";
          const domain = getCookieDomain();

          // Save to localStorage
          localStorage.setItem("authToken", result.token);

          // Save to cookie
          const cookieValue = `token=${result.token}; path=/; max-age=${7 * 24 * 60 * 60
            }; ${isProduction ? `secure; samesite=none; domain=${domain}` : "samesite=lax"}`;
          document.cookie = cookieValue;

          console.log("✅ [Register] Token saved successfully");
        } else {
          console.warn("⚠️ [Register] No token in response, user may not be fully authenticated");
        }

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
    console.log("🚪 [Logout] Starting logout process...");

    // Clear user state immediately
    if (user !== null) setUser(null);

    try {
      // Call backend logout API with POST method (fire and forget)
      apiCall("/api/auth/logout", {}).catch(err => {
        console.warn("Backend logout failed:", err);
      });
    } catch (error) {
      console.warn("Backend logout error:", error);
    }

    // Helper function for dynamic cookie domain
    const getCookieDomain = () => {
      if (typeof window === "undefined") return "";
      const isProduction = window.location.protocol === "https:";
      if (!isProduction) return "";
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      if (hostname.endsWith('.vercel.app') && parts.length > 2) return "";
      if (hostname.endsWith('.vercel.app') && parts.length === 2) return ".vercel.app";
      if (parts.length >= 2) return `.${parts.slice(-2).join('.')}`;
      return "";
    };

    const isProduction = window.location.protocol === "https:";
    const domain = getCookieDomain();

    // Clear all cookies with multiple configurations
    const cookieNames = ["token", "auth-token", "authToken", "jwt", "token-fallback", "session-token"];

    const clearCookie = (name: string) => {
      const cookieConfigs = [
        `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`,
        `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure`,
        `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=lax`,
        `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=none`,
        `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=lax`,
        `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=none`,
        `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${window.location.hostname}`,
        `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${window.location.hostname}; secure`,
        // Production domain-specific clearing
        ...(isProduction && domain ? [
          `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${domain}; secure; samesite=none`,
        ] : []),
      ];

      cookieConfigs.forEach((config) => {
        document.cookie = config;
      });
    };

    cookieNames.forEach(name => clearCookie(name));

    // Clear all storage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn("Could not clear storage:", e);
    }

    console.log("✅ [Logout] Cleanup complete, redirecting to /login...");

    // Single redirect at the end
    window.location.replace("/login");
  };

  // Google OAuth redirect handling - MUST RUN BEFORE checkAuth effect!
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const googleLoginSuccess = urlParams.get("google_login");
    const tempToken = urlParams.get("temp_token");

    console.log("🔍 [OAuth] Checking URL params:", {
      googleLoginSuccess,
      hasTempToken: !!tempToken,
      oauthHandled: oauthHandledRef.current,
      currentPath: window.location.pathname
    });

    if ((googleLoginSuccess === "success" || tempToken) && !oauthHandledRef.current) {
      console.log("✅ [OAuth] Google OAuth callback detected!");

      // Mark as handled to prevent re-processing
      oauthHandledRef.current = true;

      // Helper function for dynamic cookie domain
      const getCookieDomain = () => {
        if (typeof window === "undefined") return "";
        const isProduction = window.location.protocol === "https:";
        if (!isProduction) return "";
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        if (hostname.endsWith('.vercel.app') && parts.length > 2) return "";
        if (hostname.endsWith('.vercel.app') && parts.length === 2) return ".vercel.app";
        if (parts.length >= 2) return `.${parts.slice(-2).join('.')}`;
        return "";
      };

      // Handle temp_token from URL
      if (tempToken) {
        try {
          const decodedToken = decodeURIComponent(tempToken);
          console.log("🔑 [OAuth] Storing temp_token to localStorage...");

          // Store in localStorage
          localStorage.setItem("authToken", decodedToken);

          // Set cookie with proper domain
          const isProduction = window.location.protocol === "https:";
          const domain = getCookieDomain();
          const cookieValue = `token=${decodedToken}; path=/; max-age=${7 * 24 * 60 * 60
            }; ${isProduction ? `secure; samesite=none; domain=${domain}` : "samesite=lax"}`;
          document.cookie = cookieValue;

          console.log("✅ [OAuth] Token stored successfully in localStorage and cookie");
        } catch (e) {
          console.error("❌ [OAuth] Failed to decode temp_token:", e);
        }
      }

      // Remove URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete("google_login");
      url.searchParams.delete("_t");
      url.searchParams.delete("temp_token");
      window.history.replaceState({}, "", url.toString());

      console.log("🔄 [OAuth] URL cleaned, triggering auth check...");

      // Trigger auth check after a short delay to ensure cookie is set
      const authCheckDelay = isMobile ? 2000 : 1000;
      setTimeout(() => {
        console.log("🔄 [OAuth] Calling checkAuth()...");
        checkAuth();
      }, authCheckDelay);
    }
  }); // ✅ NO dependencies - runs on every render to catch OAuth callback FIRST

  // Check authentication on mount - RUNS AFTER OAuth check
  useEffect(() => {
    // Don't run checkAuth if OAuth callback is being handled
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthParams = urlParams.get("google_login") || urlParams.get("temp_token");

    if (!hasCheckedRef.current && !hasOAuthParams) {
      console.log("🔄 [checkAuth] No OAuth params, running initial auth check...");
      hasCheckedRef.current = true;
      checkAuth();
    } else if (hasOAuthParams) {
      console.log("⏸️ [checkAuth] OAuth params detected, skipping initial check (OAuth handler will take care)");
    }
  }, [checkAuth]);

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