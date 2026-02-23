import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

// Fallback untuk development/testing
if (!JWT_SECRET && process.env.NODE_ENV !== 'production') {
  console.warn('[MIDDLEWARE] JWT_SECRET not set, using fallback for development');
}

// Configuration for different path types
const ROUTE_CONFIG = {
  // Protected routes that require authentication
  protected: [
    "/dashboard",
    "/channel",
    "/hospitality",
    "/chromecast",
    "/users",
    "/staff",
  ],

  // Auth routes (login/register pages)
  auth: [
    "/login",
    "/register"
  ],

  // Protected API routes
  protectedAPI: [
    "/api/channels",
    "/api/hospitality/tvs",
    "/api/chromecast",
    "/api/config",
    "/api/users",
  ],

  // Public API routes (bypass auth, still proxy to Railway)
  publicAPI: [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/google",
    "/api/auth/google/callback",
    "/api/auth/logout",
    "/api/auth/health",
  ],

  // Static files and Next.js internals
  static: [
    "/_next/",
    "/static/",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
  ],
};

/**
 * Verify JWT token and return user data
 */
async function verifyAuthToken(token) {
  try {
    // Check JWT_SECRET
    if (!JWT_SECRET) {
      console.error("[MIDDLEWARE] JWT_SECRET is not configured");
      return { isValid: false, user: null };
    }

    // Validasi token format
    if (!token || typeof token !== 'string' || token.length < 10) {
      return { isValid: false, user: null };
    }

    // Timeout untuk JWT verification
    const verifyPromise = jwtVerify(token, JWT_SECRET);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('JWT verification timeout')), 5000)
    );

    const { payload } = await Promise.race([verifyPromise, timeoutPromise]);

    // Validasi payload
    if (!payload || !payload.userId || !payload.username) {
      console.error("Invalid token payload:", payload);
      return { isValid: false, user: null };
    }

    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    const bufferTime = 30; // 30 detik buffer

    if (payload.exp && payload.exp < (now + bufferTime)) {
      console.error("Token expired or about to expire");
      return { isValid: false, user: null };
    }

    return {
      isValid: true,
      user: {
        id: payload.userId,
        username: payload.username,
        email: payload.email,
        role: payload.role || 'guest',
      },
    };
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return { isValid: false, user: null };
  }
}

/**
 * Check if pathname matches any route in the given array
 */
function matchesRoutes(pathname, routes) {
  return routes.some((route) => {
    if (route.endsWith("/")) {
      return pathname.startsWith(route);
    }
    return pathname === route || pathname.startsWith(route + "/");
  });
}

/**
 * Check if the request is for static files
 */
function isStaticFile(pathname) {
  return (
    matchesRoutes(pathname, ROUTE_CONFIG.static) ||
    pathname.includes(".") ||
    pathname.startsWith("/_next/")
  );
}

/**
 * Create a redirect response with optional cookie clearing
 */
function createRedirect(request, destination, clearCookie = false, reason = "") {
  const response = NextResponse.redirect(new URL(destination, request.url));

  if (clearCookie) {
    // Clear cookie dengan berbagai konfigurasi untuk Edge Runtime
    const cookieConfigs = [
      { httpOnly: true, secure: true, sameSite: "none", maxAge: 0, path: "/" },
      { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/" },
      { httpOnly: true, secure: false, sameSite: "lax", maxAge: 0, path: "/" },
      { httpOnly: false, secure: true, sameSite: "none", maxAge: 0, path: "/" },
      { httpOnly: false, secure: true, sameSite: "lax", maxAge: 0, path: "/" },
      { httpOnly: false, secure: false, sameSite: "lax", maxAge: 0, path: "/" },
      { maxAge: 0, path: "/" },
      { expires: new Date(0), path: "/" }
    ];

    cookieConfigs.forEach(config => {
      try {
        response.cookies.set("token", "", config);
      } catch (e) {
        // Ignore errors from cookie clearing
        console.warn("[MIDDLEWARE] Failed to clear cookie with config:", config);
      }
    });

    // Also try to clear with different cookie names
    const cookieNames = ["token", "auth-token", "authToken", "jwt"];
    cookieNames.forEach(name => {
      try {
        response.cookies.delete(name);
      } catch (e) {
        // Ignore errors
      }
    });

    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  response.headers.set('Vary', 'Cookie');
  return response;
}

/**
 * Main middleware function
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip middleware untuk static files dan Next.js internals
  if (isStaticFile(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth/google")) {
    return NextResponse.next();
  }

  // CRITICAL FIX: Check for token in query parameter (for cross-origin login scenarios)
  const url = request.nextUrl;
  const queryToken = url.searchParams.get("token") || url.searchParams.get("temp_token");
  const googleLoginSuccess = url.searchParams.get("google_login");

  if (queryToken && pathname !== "/login") {
    console.log("[MIDDLEWARE] Token found in query parameter:", {
      tokenType: url.searchParams.get("token") ? "token" : "temp_token",
      googleLogin: googleLoginSuccess,
      pathname
    });

    // Verify the token first
    try {
      if (JWT_SECRET) {
        const verifyPromise = jwtVerify(queryToken, JWT_SECRET);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('JWT verification timeout')), 5000)
        );

        const { payload } = await Promise.race([verifyPromise, timeoutPromise]);

        console.log("[MIDDLEWARE] Query token verified successfully:", payload);

        // Token is valid, set cookie and continue to the page (NOT redirect)
        const response = NextResponse.next();

        // Set cookie with proper configuration for Edge Runtime
        const isProduction = process.env.NODE_ENV === "production";
        const cookieOptions = isProduction
          ? {
              httpOnly: false,
              secure: true,
              sameSite: "none",
              maxAge: 7 * 24 * 60 * 60, // 7 days
              path: "/"
            }
          : {
              httpOnly: false,
              sameSite: "lax",
              maxAge: 7 * 24 * 60 * 60,
              path: "/"
            };

        response.cookies.set("token", queryToken, cookieOptions);
        response.cookies.set("authToken", queryToken, cookieOptions); // Also set authToken

        // Add user info headers for protected pages
        response.headers.set("x-user-id", payload.userId);
        response.headers.set("x-user-username", payload.username);
        response.headers.set("x-user-email", payload.email || "");
        response.headers.set("Vary", "Cookie");

        // Clean URL by removing OAuth parameters
        const cleanUrl = new URL(request.url);
        cleanUrl.searchParams.delete("token");
        cleanUrl.searchParams.delete("temp_token");
        cleanUrl.searchParams.delete("google_login");
        cleanUrl.searchParams.delete("_t");

        // Only redirect if URL was changed
        if (cleanUrl.search !== url.search) {
          const redirectResponse = NextResponse.redirect(cleanUrl.toString());
          // Copy the cookie settings to redirect response
          redirectResponse.cookies.set("token", queryToken, cookieOptions);
          redirectResponse.cookies.set("authToken", queryToken, cookieOptions);
          console.log("[MIDDLEWARE] Redirecting to clean URL:", cleanUrl.pathname);
          return redirectResponse;
        }

        console.log("[MIDDLEWARE] Continuing to page with token set");
        return response;
      }
    } catch (error) {
      console.error("[MIDDLEWARE] Query token verification failed:", error);
      // If token verification fails, redirect to login
      return createRedirect(request, "/login", false, "Invalid query token");
    }
  }

  // Allow all public API routes
  if (matchesRoutes(pathname, ROUTE_CONFIG.publicAPI)) {
    return NextResponse.next();
  }

  // Enhanced token extraction untuk mobile
  let token =
    request.cookies.get("token")?.value ||
    request.cookies.get("auth-token")?.value ||
    request.cookies.get("jwt")?.value ||
    request.cookies.get("authToken")?.value ||
    request.cookies.get("token-fallback")?.value ||
    request.cookies.get("session-token")?.value;

  // Fallback token dari header untuk mobile
  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  // Verify token if present
  let authResult = { isValid: false, user: null };
  if (token) {
    authResult = await verifyAuthToken(token);
  }

  // Handle root path
  if (pathname === "/") {
    if (authResult.isValid) {
      return createRedirect(
        request,
        "/dashboard",
        false,
        "Authenticated user accessing root"
      );
    } else {
      return createRedirect(
        request,
        "/login",
        !!token,
        "Unauthenticated user accessing root"
      );
    }
  }

  // Handle auth pages (login, register)
  if (matchesRoutes(pathname, ROUTE_CONFIG.auth)) {
    if (authResult.isValid) {
      return createRedirect(
        request,
        "/dashboard",
        false,
        "Authenticated user accessing auth page"
      );
    }
    return NextResponse.next();
  }

  // Handle protected pages
  if (matchesRoutes(pathname, ROUTE_CONFIG.protected)) {
    if (!authResult.isValid) {
      const shouldClearCookie = !!token && !authResult.isValid;
      return createRedirect(
        request,
        "/login",
        shouldClearCookie,
        "Unauthenticated access to protected route"
      );
    }

    // Check for admin-only routes
    const adminOnlyRoutes = ["/users", "/staff"];
    const isAdminOnlyRoute = adminOnlyRoutes.some(route =>
      pathname === route || pathname.startsWith(route + "/")
    );

    if (isAdminOnlyRoute) {
      const userRole = authResult.user?.role || 'guest';
      if (userRole !== 'admin') {
        console.log("[MIDDLEWARE] Non-admin user attempting to access admin route:", {
          pathname,
          userRole,
          userId: authResult.user?.id
        });
        return createRedirect(
          request,
          "/dashboard",
          false,
          "Non-admin user attempting to access admin route"
        );
      }
    }

    // Add user info headers for protected pages
    const response = NextResponse.next();
    if (authResult.user) {
      response.headers.set("x-user-id", authResult.user.id);
      response.headers.set("x-user-username", authResult.user.username);
      response.headers.set("x-user-email", authResult.user.email);
      response.headers.set("x-user-role", authResult.user.role || 'guest');
    }
    response.headers.set("Vary", "Cookie");
    return response;
  }

  // Handle protected API routes
  if (matchesRoutes(pathname, ROUTE_CONFIG.protectedAPI)) {
    if (!authResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Vary: "Cookie",
          },
        }
      );
    }

    // Add user info to request headers for API
    const response = NextResponse.next();
    if (authResult.user) {
      response.headers.set("x-user-id", authResult.user.id);
      response.headers.set("x-user-username", authResult.user.username);
      response.headers.set("x-user-email", authResult.user.email);
      response.headers.set("x-user-role", authResult.user.role || 'guest');
    }
    response.headers.set("Vary", "Cookie");
    return response;
  }

  // Default behavior for other routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};