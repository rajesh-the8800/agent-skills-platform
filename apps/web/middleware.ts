import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    const session = req.auth;
    if (!session?.user) {
      const url = req.nextUrl.clone();
      url.pathname = '/skills';
      url.searchParams.set('authRequired', '1');
      return NextResponse.redirect(url);
    }
    const role = session.user.role;
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/skills', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],
};
