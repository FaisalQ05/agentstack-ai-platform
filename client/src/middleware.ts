import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

type JwtPayload = {
  id: string;
  role: 'user' | 'admin';
  sessionId: string;
  exp?: number;
  iat?: number;
};

export function middleware(req: NextRequest) {
  console.log('IN MIDDLEWARE');
  const token = req.cookies.get('refreshToken')?.value || null;
  console.log({ token });
  const { pathname } = req.nextUrl;

  // Public routes
  const publicRoutes = ['/login', '/register'];

  // If public page and logged in → redirect
  if (publicRoutes.includes(pathname) && token) {
    const decoded = jwtDecode<JwtPayload>(token);
    const role = decoded.role;
    const redirectUrl = role === 'admin' ? '/admin/dashboard' : '/dashboard';
    console.log('Redirecting to', redirectUrl);
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  // Protected user routes
  if (pathname.startsWith('/dashboard')) {
    if (!token) return NextResponse.redirect(new URL('/login', req.url));

    const decoded = jwtDecode<JwtPayload>(token);
    if (decoded.role !== 'user')
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    return NextResponse.next();
  }

  // Protected admin routes
  if (pathname.startsWith('/admin')) {
    if (!token) return NextResponse.redirect(new URL('/login', req.url));

    const decoded = jwtDecode<JwtPayload>(token);
    if (decoded.role !== 'admin')
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register'],
};
