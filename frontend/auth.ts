import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Here we call YOUR Hono backend login endpoint
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
          method: 'POST',
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" }
        })

        const data = await res.json()

        // If login is successful, return the user + token
        if (res.ok && data.user) {
          return {
            ...data.user,
            accessToken: data.token // This is the JWT from your Hono backend
          }
        }
        return null
      }
    })
  ],
  callbacks: {
    // This part "Syncs" your Hono JWT with the Auth.js Session
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken
        token.organizationId = (user as any).organizationId
      }
      return token
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).organizationId = token.organizationId;
      return session
    }
  }
})