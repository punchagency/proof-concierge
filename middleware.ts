import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/login';
  
  // Check if the user is authenticated by looking for the auth_token in localStorage
  // Note: We can't access localStorage directly in middleware, so we use cookies instead
  const token = request.cookies.get('auth_token')?.value;
  const isAuthenticated = !!token;

  // Redirect logic
  if (!isAuthenticated && !isPublicPath) {
    // If not authenticated and trying to access a protected route, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && isPublicPath) {
    // If authenticated and trying to access login page, redirect to home
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Continue with the request if no redirects are needed
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (API routes for authentication)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - test-call (test call pages)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|test-call).*)',
  ],
}; 