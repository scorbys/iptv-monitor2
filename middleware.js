import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode("Pec@tu2024++");

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
      return { isValid: false, user: null };
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Validasi payload
    if (!payload || !payload.userId || !payload.username || !payload.email) {
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
  const { pathname } = request.nextUrl;

  // Skip middleware untuk static files dan Next.js internals
  if (isStaticFile(pathname)) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get("token")?.value;

  // Verify token if present
  let authResult = { isValid: false, user: null };
  if (token) {
    authResult = await verifyAuthToken(token);
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

  // Handle protected API routes
  if (pathname.startsWith("/api/")) {
    if (!authResult.isValid) {
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

  // Handle protected page routes
  if (matchesRoutes(pathname, ROUTE_CONFIG.protected)) {
    if (!authResult.isValid) {
      const shouldClearCookie = !!token && !authResult.isValid;
      return createRedirect(
        request,
        "/login",
        shouldClearCookie,
        `Unauthenticated access to protected route`
      );
    }

    // Add user info headers for protected pages
    const response = NextResponse.next();
    if (authResult.user) {
      response.headers.set("x-user-id", authResult.user.id);
      response.headers.set("x-user-username", authResult.user.username);
      response.headers.set("x-user-email", authResult.user.email);
    }
    return response;
  }

  // Default behavior for other routes
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
}

export const config = {
  matcher: [
    "/((?!api/health|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};