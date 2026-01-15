// lib/auth/client.ts
// Better Auth client configuration for React frontend

// User → Types email/password → Clicks Login → Better Auth client calls /api/auth/login → 
// Backend validates → Returns JWT + user → Better Auth stores token → 
// Token automatically attached to API requests via api.ts interceptor → 
// Redirect to dashboard → All API calls include Authorization: Bearer <token>

import { betterAuth } from 'better-auth';

// create a variable authClient
// it tells that our backend is located at 3001 or at the URL defined in NEXT_PUBLIC_API_URL
export const authClient = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET || 'your-development-secret-change-in-production',
    emailAndPassword: {
        enabled: true,
    }
});

console.log('Better Auth API:', Object.keys(authClient.api));
// when authClient.signIn is called, it will bundle the credentials into a JSON object
// and send it to the backend /api/auth/login endpoint
// which is expected to return a JSON object with { token, user } structure