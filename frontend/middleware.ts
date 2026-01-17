import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Auth.js v5 uses 'authjs.session-token' instead of 'next-auth.session-token'
  const sessionToken = 
    request.cookies.get("authjs.session-token") || 
    request.cookies.get("__Secure-authjs.session-token") ||
    request.cookies.get("next-auth.session-token") || 
    request.cookies.get("__Secure-next-auth.session-token");
  
  const isLoggedIn = !!sessionToken;
  const { nextUrl } = request;

  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");
  const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");

  // 1. If trying to access dashboard while logged out -> Login
  if (isDashboardRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // 2. If trying to access login while logged in -> Dashboard
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}