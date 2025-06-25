import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode('Pec@tu2024++');

// Configuration for different path types
const ROUTE_CONFIG = {
  // Public routes that don't require authentication
  public: [
    '/login',
    '/register',
    '/api/auth/login',
    '/api/auth/register',
    '/api/health'
  ],
  
  // Protected routes that require authentication
  protected: [
    '/dashboard',
    '/channels',
    '/hospitality',
    '/chromecast',
    '/api/channels',
    '/api/hospitality',
    '/api/chromecast',
    '/api/config'
  ],
  
  // Static files and Next.js internals
  static: [
    '/_next/',
    '/static/',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml'
  ]
};

/**
 * Verify JWT token and return user data
 * @param {string} token - JWT token to verify
 * @returns {Promise<{isValid: boolean, user: any}>}
 */
async function verifyAuthToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      isValid: true,
      user: {
        id: payload.userId,
        username: payload.username,
        email: payload.email
      }
    };
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return { isValid: false, user: null };
  }
}

/**
 * Check if pathname matches any route in the given array
 * @param {string} pathname - Request pathname
 * @param {string[]} routes - Array of route patterns
 * @returns {boolean}
 */
function matchesRoutes(pathname, routes) {
  return routes.some(route => {
    if (route.endsWith('/')) {
      return pathname.startsWith(route);
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

/**
 * Check if the request is for static files
 * @param {string} pathname - Request pathname
 * @returns {boolean}
 */
function isStaticFile(pathname) {
  return (
    matchesRoutes(pathname, ROUTE_CONFIG.static) ||
    pathname.includes('.') ||
    pathname.startsWith('/_next/')
  );
}

/**
 * Create a redirect response with optional cookie clearing
 * @param {Request} request - Next.js request object
 * @param {string} destination - Redirect destination
 * @param {boolean} clearCookie - Whether to clear the auth cookie
 * @param {string} reason - Reason for redirect (for logging)
 * @returns {NextResponse}
 */
function createRedirect(request, destination, clearCookie = false, reason = '') {
  console.log(`Redirecting to ${destination}: ${reason} (from: ${request.nextUrl.pathname})`);
  
  const response = NextResponse.redirect(new URL(destination, request.url));
  
  if (clearCookie) {
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    });
  }
  
  return response;
}

/**
 * Main middleware function
 * @param {Request} request - Next.js request object
 * @returns {Promise<NextResponse>}
 */
export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and Next.js internals
  if (isStaticFile(pathname)) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get('token')?.value;
  
  // Verify token if present
  let authResult = { isValid: false, user: null };
  if (token) {
    authResult = await verifyAuthToken(token);
  }

  // Handle public routes
  if (matchesRoutes(pathname, ROUTE_CONFIG.public)) {
    // If user is authenticated and trying to access login/register, redirect to dashboard
    if (authResult.isValid && (pathname === '/login' || pathname === '/register')) {
      return createRedirect(request, '/dashboard', false, 'Authenticated user accessing auth pages');
    }
    return NextResponse.next();
  }

  // Handle root path
  if (pathname === '/') {
    if (authResult.isValid) {
      return createRedirect(request, '/dashboard', false, 'Authenticated user accessing root');
    } else {
      return createRedirect(request, '/login', true, 'Unauthenticated user accessing root');
    }
  }

  // Handle protected routes
  if (matchesRoutes(pathname, ROUTE_CONFIG.protected)) {
    if (!authResult.isValid) {
      return createRedirect(request, '/login', true, 'Unauthenticated access to protected route');
    }
    return NextResponse.next();
  }

  // Handle API routes that aren't explicitly configured
  if (pathname.startsWith('/api/')) {
    if (!authResult.isValid) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Default behavior for other routes
  if (!authResult.isValid) {
    return createRedirect(request, '/login', true, 'Unauthenticated access to unspecified route');
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Any file with extension in root
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};