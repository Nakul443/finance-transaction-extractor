import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // 1. Add trustHost to fix the 'UntrustedHost' error
  trustHost: true, 
  secret: process.env.NEXTAUTH_SECRET, 
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
          method: 'POST',
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" }
        })

        const data = await res.json()

        if (res.ok && data.user) {
          return {
            ...data.user,
            accessToken: data.token 
          }
        }
        return null
      }
    })
  ],
})