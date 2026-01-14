// lib/auth/client.ts
// Better Auth client configuration for React frontend

// User → Types email/password → Clicks Login → Better Auth client calls /api/auth/login → 
// Backend validates → Returns JWT + user → Better Auth stores token → 
// Token automatically attached to API requests via api.ts interceptor → 
// Redirect to dashboard → All API calls include Authorization: Bearer <token>

import { createAuthClient } from 'better-auth/react';

// create a variable authClient
// it tells that our backend is located at 3001 or at the URL defined in NEXT_PUBLIC_API_URL
export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',

    // Map backend endpoints to Better Auth
    endpoints: {
        signIn: {
            // connect login endpoint to better auth
            path: '/api/auth/login',
            method: 'POST'
        },
        signUp: {
            // connect register endpoint to better auth
            path: '/api/auth/register',
            method: 'POST'
        },
        signOut: {
            // connect logout endpoint to better auth
            path: '/api/auth/logout',
            method: 'POST'
        },
        getSession: {
            // connect session endpoint to better auth
            path: '/api/auth/session',
            method: 'GET'
        }
    },

    // Session configuration matching our backend
    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60, // 7 days to match backend JWT expiry
        updateAge: 24 * 60 * 60 // Update session every 24 hours
    },

    // intercept the answer coming back from the backend and translate it to Better Auth format
    callbacks: {
        onSignIn: (response: any) => {
            // backend returns { token, user } structure
            // Transform it for Better Auth
            return {
                user: response.user,
                token: response.token
            };
        }
    }
});

// when authClient.signIn is called, it will bundle the credentials into a JSON object
// and send it to the backend /api/auth/login endpoint
// which is expected to return a JSON object with { token, user } structure