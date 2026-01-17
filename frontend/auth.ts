import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true, 
  secret: process.env.AUTH_SECRET, // Use AUTH_SECRET for v5 standard
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
          // The object returned here is passed to the 'jwt' callback as 'user'
          return {
            ...data.user,
            accessToken: data.token 
          }
        }
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 'user' is only available the first time a user signs in
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.organizationId = (user as any).organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      // Transfer data from the JWT token to the Session object
      if (token) {
        session.accessToken = token.accessToken as string;
        (session.user as any).organizationId = token.organizationId;
      }
      return session;
    },
  },
})