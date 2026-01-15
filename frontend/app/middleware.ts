import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req: { auth: any; nextUrl?: URL }) => {
  const isLoggedIn = !!req.auth
  const nextUrl = req.nextUrl

  if (!nextUrl) {
    return NextResponse.next()
  }

  const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}