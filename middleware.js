import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "Pec@tu2024++");

// Configuration for different path types
const ROUTE_CONFIG = {
  // Public routes that don't require authentication
  public: [
    "/login",
    "/register",
    "/api/auth/login",
    "/api/auth/register",
    "/api/health",
  ],

  // Protected routes that require authentication
  protected: [
    "/dashboard",
    "/channel",
    "/hospitality",
    "/chromecast",
    "/api/channels",
    "/api/hospitality",
    "/api/chromecast",
    "/api/config",
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
    if (!token || typeof token !== 'string') {
      return { isValid: false, user: null, error: "No token provided" };
    }

    // Validate JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not configured in middleware");
      return { isValid: false, user: null, error: "Server configuration error" };
    }

    // Tambahkan timeout untuk JWT verification dengan lebih pendek
    const verifyPromise = jwtVerify(token, JWT_SECRET);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('JWT verification timeout')), 3000); // 3 detik
    });

    const { payload } = await Promise.race([verifyPromise, timeoutPromise]);

    // Validasi payload dengan lebih ketat
    if (!payload || typeof payload !== 'object') {
      console.log("Invalid payload type:", typeof payload);
      return { isValid: false, user: null, error: "Invalid token structure" };
    }

    if (!payload.userId || !payload.username || !payload.email) {
      console.log("Missing required fields in payload:", {
        hasUserId: !!payload.userId,
        hasUsername: !!payload.username,
        hasEmail: !!payload.email
      });
      return { isValid: false, user: null, error: "Invalid token payload" };
    }

    // Check token expiration
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      console.log("Token expired:", { exp: payload.exp, now: currentTime });
      return { isValid: false, user: null, error: "Token expired" };
    }

    return {
      isValid: true,
      user: {
        id: payload.userId,
        username: payload.username,
        email: payload.email,
      },
      error: null
    };
  } catch (error) {
    console.error("Token verification failed:", {
      message: error.message,
      name: error.name,
      tokenLength: token?.length || 0
    });
    
    let errorMessage = "Token verification failed";
    
    if (error.message === 'JWT verification timeout') {
      errorMessage = "Token verification timeout";
    } else if (error.name === 'JWTExpired') {
      errorMessage = "Token expired";
    } else if (error.name === 'JWTInvalid') {
      errorMessage = "Invalid token format";
    }
    
    return { isValid: false, user: null, error: errorMessage };
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
  console.log(
    `Redirecting to ${destination}: ${reason} (from: ${request.nextUrl.pathname})`
  );

  const response = NextResponse.redirect(new URL(destination, request.url));

  if (clearCookie) {
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
  }

  return response;
}

/**
 * Main middleware function
 */
export async function middleware(request) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;

  try {
    // Skip middleware untuk static files dan Next.js internals
    if (isStaticFile(pathname)) {
      return NextResponse.next();
    }

    // Get token from cookies
    const token = request.cookies.get("token")?.value;

    // Verify token if present dengan timeout
    let authResult = { isValid: false, user: null, error: null };
    if (token) {
      try {
        authResult = await verifyAuthToken(token);
      } catch (verifyError) {
        console.error("Auth verification error:", verifyError);
        authResult = { isValid: false, user: null, error: "Verification failed" };
      }
    }

    // Handle public routes
    if (matchesRoutes(pathname, ROUTE_CONFIG.public)) {
      if (
        authResult.isValid &&
        (pathname === "/login" || pathname === "/register")
      ) {
        return createRedirect(
          request,
          "/dashboard",
          false,
          "Authenticated user accessing auth pages"
        );
      }
      return NextResponse.next();
    }

    // Handle root path
    if (pathname === "/") {
      if (authResult.isValid) {
        return createRedirect(request, "/dashboard", false, "Authenticated user accessing root");
      } else {
        return createRedirect(request, "/login", true, "Unauthenticated user accessing root");
      }
    }

    // Handle protected API routes dengan improved error response
    if (pathname.startsWith("/api/")) {
      if (!authResult.isValid) {
        console.log("API access denied:", {
          path: pathname,
          hasToken: !!token,
          error: authResult.error,
          duration: Date.now() - startTime
        });
        
        return NextResponse.json(
          { 
            success: false, 
            error: authResult.error || "Authentication required",
            code: "AUTH_REQUIRED"
          },
          { status: 401 }
        );
      }

      // Add user info to request headers for API dengan error handling
      try {
        const response = NextResponse.next();
        if (authResult.user) {
          response.headers.set("x-user-id", authResult.user.id);
          response.headers.set("x-user-username", authResult.user.username);
          response.headers.set("x-user-email", authResult.user.email);
        }
        return response;
      } catch (headerError) {
        console.error("Error setting headers:", headerError);
        return NextResponse.next(); // Continue tanpa headers
      }
    }

    // Handle protected page routes
    if (matchesRoutes(pathname, ROUTE_CONFIG.protected)) {
      if (!authResult.isValid) {
        const shouldClearCookie = !!token && !authResult.isValid;
        console.log("Protected page access denied:", {
          path: pathname,
          hasToken: !!token,
          shouldClearCookie,
          error: authResult.error,
          duration: Date.now() - startTime
        });
        
        return createRedirect(
          request,
          "/login",
          shouldClearCookie,
          `Unauthenticated access: ${authResult.error || 'No valid token'}`
        );
      }

      // Add user info headers for protected pages dengan error handling
      try {
        const response = NextResponse.next();
        if (authResult.user) {
          response.headers.set("x-user-id", authResult.user.id);
          response.headers.set("x-user-username", authResult.user.username);
          response.headers.set("x-user-email", authResult.user.email);
        }
        return response;
      } catch (headerError) {
        console.error("Error setting headers for protected page:", headerError);
        return NextResponse.next(); // Continue tanpa headers
      }
    }

    // Default behavior untuk routes lain
    if (!authResult.isValid) {
      const shouldClearCookie = !!token && !authResult.isValid;
      return createRedirect(
        request,
        "/login",
        shouldClearCookie,
        "Unauthenticated access to unspecified route"
      );
    }

    return NextResponse.next();
    
  } catch (error) {
    console.error("Middleware error:", {
      message: error.message,
      stack: error.stack,
      pathname,
      duration: Date.now() - startTime
    });
    
    // Fallback behavior pada error
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Middleware error",
          code: "MIDDLEWARE_ERROR"
        },
        { status: 500 }
      );
    }
    
    // Untuk page routes, redirect ke login
    return createRedirect(
      request,
      "/login",
      true,
      "Middleware error - redirecting to login"
    );
  }
}

export const config = {
  matcher: [
    // Exclude specific paths that don't need middleware
    "/((?!api/health|api/auth/login|api/auth/register|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};