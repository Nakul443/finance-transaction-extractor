// for protecting routes with JWT
// authentication middleware

// request intercepted -> header check (checks if Authorization: Bearer <token> exists)
// -> token extraction (strip away "Bearer ") -> verification (jwtVerify and JWT_SECRET)
// -> payload extraction (pull userId out of verified token)
// -> database validation (use prisma to check if userId exists in database)
// -> save user's ID, email, orgID into 'c' backpack using c.set()
// -> await next() called allowing request to move to the actual API logic ->
// -> error handling

import { createMiddleware } from 'hono/factory' // to create middleware, this function intercepts a request before it reaches the logic
import { jwtVerify } from 'jose' // JWT verification
import { prisma } from '../lib/db' // Database client

// same secret key as /routes/auth.ts
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret'
)


// schema for the logged-in user
export interface AuthenticatedUser {
  id: string
  email: string
  organizationId: string
}

// authentication middleware
export const authMiddleware = createMiddleware(async (c, next) => {
    try {
        // looks for a specific header "Authorization"
        // standard way to represent
            // Authorization: Bearer <token>
        const authHeader = c.req.header('Authorization')

        // check if header exists and starts with 'Bearer '
        // this means no token is provided
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        // Extract token (raw JWT string)
        // cuts of "Bearer " part
        const token = authHeader.substring(7)

        // verify JWT token
        const { payload } = await jwtVerify(token, JWT_SECRET)

        // Get user ID from token
        const userId = payload.userId as string
        if (!userId || typeof userId !== 'string') {
        return c.json({ error: 'Invalid token' }, 401)
        }

        // Check if user still exists in database
        const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, organizationId: true }
        })

        if (!user) {
        return c.json({ error: 'User not found' }, 401)
        }

        // Attach user info to request context
        // Now any route of the same request can access: c.get('user')
        // this way we know which user is making the request
        // and other functions don't have to re-verify the token and the user again and again
        c.set('user', {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId
        } as AuthenticatedUser)

        // this confirms that the check is complete
        // and the request can proceed to the actual API logic or the next route handler
        await next()
        
    } catch (error) {
        console.error('Auth error:', error)
        return c.json({ error: 'Invalid or expired token' }, 401)
    }
})

export default authMiddleware