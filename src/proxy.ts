import { NextResponse, type NextRequest } from 'next/server';

const protectedRoutes = [
  '/dashboard',
  '/mood',
  '/habits',
  '/journal',
  '/ai-companion',
  '/insights',
  '/settings',
  '/profile',
  '/sleep',
  '/resources',
  '/subscription',
  '/admin',
];

const authCookieNames = [
  'sathi_auth',
  'authjs.session-token',
  '__Secure-authjs.session-token',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
];

function hasServerAuthCookie(request: NextRequest) {
  return authCookieNames.some((name) => {
    const value = request.cookies.get(name)?.value;
    return name === 'sathi_auth' ? value === '1' : Boolean(value);
  });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuthCookie = hasServerAuthCookie(request);
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !hasAuthCookie) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/mood/:path*',
    '/habits/:path*',
    '/journal/:path*',
    '/ai-companion/:path*',
    '/insights/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/sleep/:path*',
    '/resources/:path*',
    '/subscription/:path*',
    '/admin/:path*',
  ],
};
