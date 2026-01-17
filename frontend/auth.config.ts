export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.accessToken = (user as any).accessToken
        token.organizationId = (user as any).organizationId
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        (session.user as any).organizationId = token.organizationId as string;
        (session as any).accessToken = token.accessToken as string;
      }
      return session
    }
  },
  providers: [], // Keep this empty for now
}