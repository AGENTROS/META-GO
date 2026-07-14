import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWTTokenServer } from './lib/tokenVerifier';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('celestial_jwt')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  const payload = await verifyJWTTokenServer(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL('/auth', request.url));
    response.cookies.delete('celestial_jwt');
    response.cookies.delete('celestial_auth');
    response.cookies.delete('celestial_admin');
    return response;
  }

  // RBAC for admin pages
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/vault/:path*',
    '/sbt-gallery/:path*',
    '/billing/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/admin/:path*'
  ],
};
