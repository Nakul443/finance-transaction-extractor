// manages user's state on the frontend
// handles user authentication by connecting frontend to backend
// AUTHENTICATION FLOW
// User → Types email/password → Clicks Login → NextAuth authorize() runs in config.ts → Calls backend /api/auth/login → 
// Backend validates credentials → Returns JWT token + user data → NextAuth stores token in session in config.ts → 
// Token automatically attached to API requests → User redirected to dashboard → 
// All future API calls include Authorization: Bearer <token> header


// lib/auth/config.ts
import type { DefaultSession, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authAPI } from "@/lib/api";

declare module "next-auth" {
    // define custom properties for user, session, and JWT
    // these properties will be available throughout the app
    interface User {
        organizationId?: string;
        token?: string;
    }
    interface Session {
        user: {
            id?: string;
            organizationId?: string;
        } & DefaultSession["user"];
    }
    interface JWT {
        id?: string;
        organizationId?: string;
        token?: string;
    }
}

const authOptions: NextAuthOptions = {
    // defines how user will log in
    providers: [
        // credentials provider used to log in
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            // authorization function
            // runs when the user clicks the login button
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const response = await authAPI.login({
                        email: credentials.email,
                        password: credentials.password
                    });

                    if (response.data.token && response.data.user) {
                        // if backend says login is successful,
                        // this function returns user object
                        return {
                            id: response.data.user.id,
                            email: response.data.user.email,
                            name: response.data.user.name,
                            organizationId: response.data.user.organizationId,
                            token: response.data.token
                        };
                    }
                    return null;
                } catch (error) {
                    console.error("Login error:", error);
                    return null;
                }
            }
        })
    ],
    // user's session is not stored in the database
    // instead store it in JWT
    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60
    },
    callbacks: {
        // when the user logs in, take the organization Id from the backend
        // and save it inside the encrypted cookie
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.organizationId = user.organizationId;
                token.token = (user as any).token;
            }
            return token;
        },
        // every time session is checked, add organizationId to the session object
        // when react asks "who is the logged in user?", this function runs
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.organizationId = token.organizationId as string;
                (session as any).token = token.token as string;
            }
            return session;
        }
    },

    // if a user tries to visit a protected route without being logged in
    // redirect them to the login page
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET
};

export { authOptions };