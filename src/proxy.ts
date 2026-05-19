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
  '/workouts',
  '/resources',
];

const authRoutes = ['/auth/login', '/auth/signup'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuthCookie = request.cookies.get('sathi_auth')?.value === '1';
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isAuthRoute = authRoutes.includes(pathname);

  if (isProtectedRoute && !hasAuthCookie) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && hasAuthCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
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
    '/workouts/:path*',
    '/resources/:path*',
    '/auth/login',
    '/auth/signup',
  ],
};
