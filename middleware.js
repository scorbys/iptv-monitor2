import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode('process.env.JWT_SECRET');

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
    // Timeout untuk JWT verification
    const verifyPromise = jwtVerify(token, JWT_SECRET);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('JWT verification timeout')), 3000)
    );

    const { payload } = await Promise.race([verifyPromise, timeoutPromise]);

    // Validasi payload
    if (!payload || !payload.userId || !payload.username) {
      console.error("Invalid token payload:", payload);
      return { isValid: false, user: null };
    }

    // Check token expiration lebih strict
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.error("Token expired:", new Date(payload.exp * 1000));
      return { isValid: false, user: null };
    }

    return {
      isValid: true,
      user: {
        id: payload.userId,
        username: payload.username,
        email: payload.email,
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
  console.log(
    `Redirecting to ${destination}: ${reason} (from: ${request.nextUrl.pathname})`
  );

  const response = NextResponse.redirect(new URL(destination, request.url));

  if (clearCookie) {
    // Clear cookie dengan berbagai konfigurasi
    const cookieConfigs = [
      { httpOnly: true, secure: true, sameSite: "none", maxAge: 0, path: "/" },
      { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/" },
      { httpOnly: true, secure: false, sameSite: "lax", maxAge: 0, path: "/" },
      { maxAge: 0, path: "/" }
    ];

    cookieConfigs.forEach(config => {
      response.cookies.set("token", "", config);
    });
  }

  return response;
}

/**
 * Main middleware function
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  console.log(`[MIDDLEWARE] Processing: ${pathname}`);

  // Skip middleware untuk static files dan Next.js internals
  if (isStaticFile(pathname)) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get("token")?.value;
  console.log(`[MIDDLEWARE] Token present: ${!!token}`);

  // Verify token if present
  let authResult = { isValid: false, user: null };
  if (token) {
    authResult = await verifyAuthToken(token);
    console.log(`[MIDDLEWARE] Token valid: ${authResult.isValid}`);
  }

  // Handle public routes
  if (matchesRoutes(pathname, ROUTE_CONFIG.protected)) {
    if (!authResult.isValid) {
      console.log(`[MIDDLEWARE] Blocking protected page access: ${pathname}`);
      const shouldClearCookie = !!token && !authResult.isValid;
      return createRedirect(request, "/login", shouldClearCookie, "Unauthenticated access to protected route");
    }

    // Add user info headers for protected pages
    const response = NextResponse.next();
    if (authResult.user) {
      response.headers.set("x-user-id", authResult.user.id);
      response.headers.set("x-user-username", authResult.user.username);
      response.headers.set("x-user-email", authResult.user.email); // removed duplicate .user
    }
    return response;
  }

  // Handle root path
  if (pathname === "/") {
    if (authResult.isValid) {
      console.log(`[MIDDLEWARE] Redirecting authenticated user from / to /dashboard`);
      return createRedirect(request, "/dashboard", false, "Authenticated user accessing root");
    } else {
      console.log(`[MIDDLEWARE] Redirecting unauthenticated user from / to /login`);
      return createRedirect(request, "/login", true, "Unauthenticated user accessing root");
    }
  }

  // Handle protected API routes
  if (pathname.startsWith("/api/")) {
    // Allow auth endpoints
    if (pathname.startsWith("/api/auth/")) {
      return NextResponse.next();
    }

    if (!authResult.isValid) {
      console.log(`[MIDDLEWARE] Blocking API access: ${pathname}`);
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Add user info to request headers for API
    const response = NextResponse.next();
    if (authResult.user) {
      response.headers.set("x-user-id", authResult.user.id);
      response.headers.set("x-user-username", authResult.user.username);
      response.headers.set("x-user-email", authResult.user.email);
    }
    return response;
  }

  // Default behavior for other routes
  console.log(`[MIDDLEWARE] Default handling for: ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};