import NextAuth, { type DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `auth`, `getSession` and 
   * received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string; // Add the accessToken here
    user: {
      /** The user's database ID or organization ID if you added it */
      id?: string;
      organizationId?: string;
    } & DefaultSession["user"]
  }

  interface User {
    accessToken?: string;
    organizationId?: string;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    accessToken?: string;
    organizationId?: string;
  }
}