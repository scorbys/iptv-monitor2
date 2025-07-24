import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Configuration for different path types
const ROUTE_CONFIG = {
  // Protected routes that require authentication
  protected: [
    "/dashboard",
    "/channel",
    "/hospitality",
    "/chromecast",
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
  ],

  // Public API routes
  publicAPI: [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/google",
    "/api/auth/google/callback",
    "/api/auth/verify",
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
    // Validasi token format
    if (!token || typeof token !== 'string' || token.length < 10) {
      console.error("Invalid token format");
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
    `[MIDDLEWARE] Redirecting to ${destination}: ${reason} (from: ${request.nextUrl.pathname})`
  );

  const response = NextResponse.redirect(new URL(destination, request.url));

  if (clearCookie) {
    // Clear cookie dengan berbagai konfigurasi
    const cookieConfigs = [
      { httpOnly: true, secure: true, sameSite: "none", maxAge: 0, path: "/" },
      { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/" },
      { httpOnly: true, secure: false, sameSite: "lax", maxAge: 0, path: "/" },
      { maxAge: 0, path: "/" },
      { expires: new Date(0), path: "/" }
    ];

    cookieConfigs.forEach(config => {
      response.cookies.set("token", "", config);
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

  console.log(`[MIDDLEWARE] Processing: ${pathname}`);

  // Skip middleware untuk static files dan Next.js internals
  if (isStaticFile(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/auth/google')) {
    console.log(`[MIDDLEWARE] Allowing Google OAuth path: ${pathname}`);
    return NextResponse.next();
  }

  // Allow all public API routes
  if (matchesRoutes(pathname, ROUTE_CONFIG.publicAPI)) {
    console.log(`[MIDDLEWARE] Allowing public API access: ${pathname}`);
    return NextResponse.next();
  }

  // PERBAIKAN: Enhanced token extraction untuk mobile
  let token = request.cookies.get("token")?.value ||
    request.cookies.get("auth-token")?.value ||
    request.cookies.get("jwt")?.value;

  // TAMBAHAN: Fallback token dari header untuk mobile
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log(`[MIDDLEWARE] Token found in Authorization header`);
    }
  }

  console.log(`[MIDDLEWARE] Token present: ${!!token}`);
  if (token) {
    console.log(`[MIDDLEWARE] Token preview: ${token.substring(0, 20)}...`);
  }

  // Verify token if present
  let authResult = { isValid: false, user: null };
  if (token) {
    authResult = await verifyAuthToken(token);
    console.log(`[MIDDLEWARE] Token valid: ${authResult.isValid}`);
    if (authResult.user) {
      console.log(`[MIDDLEWARE] User: ${authResult.user.username} (ID: ${authResult.user.id})`);
    }
  }

  // Handle root path
  if (pathname === "/") {
    if (authResult.isValid) {
      return createRedirect(request, "/dashboard", false, "Authenticated user accessing root");
    } else {
      return createRedirect(request, "/login", !!token, "Unauthenticated user accessing root");
    }
  }

  // Handle auth pages (login, register)
  if (matchesRoutes(pathname, ROUTE_CONFIG.auth)) {
    if (authResult.isValid) {
      return createRedirect(request, "/dashboard", false, "Authenticated user accessing auth page");
    }
    return NextResponse.next();
  }

  // Handle protected pages
  if (matchesRoutes(pathname, ROUTE_CONFIG.protected)) {
    if (!authResult.isValid) {
      console.log(`[MIDDLEWARE] Blocking protected page access: ${pathname} - Invalid token`);
      const shouldClearCookie = !!token && !authResult.isValid;
      return createRedirect(request, "/login", shouldClearCookie, "Unauthenticated access to protected route");
    }

    // Add user info headers for protected pages
    const response = NextResponse.next();
    if (authResult.user) {
      response.headers.set("x-user-id", authResult.user.id);
      response.headers.set("x-user-username", authResult.user.username);
      response.headers.set("x-user-email", authResult.user.email);
    }
    response.headers.set('Vary', 'Cookie');
    console.log(`[MIDDLEWARE] Allowing protected page access: ${pathname} for user: ${authResult.user?.username}`);
    return response;
  }

  // Handle protected API routes
  if (matchesRoutes(pathname, ROUTE_CONFIG.protectedAPI)) {
    if (!authResult.isValid) {
      console.log(`[MIDDLEWARE] Blocking protected API access: ${pathname} - Invalid token`);
      return NextResponse.json(
        { success: false, error: "Authentication required", debug: { tokenPresent: !!token, tokenValid: authResult.isValid } },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Vary': 'Cookie'
          }
        }
      );
    }

    // Add user info to request headers for API
    const response = NextResponse.next();
    if (authResult.user) {
      response.headers.set("x-user-id", authResult.user.id);
      response.headers.set("x-user-username", authResult.user.username);
      response.headers.set("x-user-email", authResult.user.email);
    }
    response.headers.set('Vary', 'Cookie');
    console.log(`[MIDDLEWARE] Allowing protected API access: ${pathname} for user: ${authResult.user?.username}`);
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
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};