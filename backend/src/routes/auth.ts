// registration and login endpoints or routes

import { Hono } from 'hono'          // Web framework
import { z } from 'zod'              // Data validation
import { hash } from 'bcryptjs'      // Password encryption, hash MD5 can also be used
import { SignJWT } from 'jose'       // JWT token creation
import { prisma } from '../lib/db'   // Database client

// Create router
const app = new Hono()

// Secret for JWT
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret'
)

// Define what valid registration data looks like
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
})


// register endpoint
app.post('/register', async (c) => {
    try {
        // GET JSON from request
        const body = await c.req.json()

        // validate data
        const { email, password, name } = registerSchema.parse(body)

        // check if user with email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return c.json({ error: 'User already exists' }, 400)
        }

        // hash password before saving
        const hashedPassword = await hash(password, 10)

        // Create organization ID
        const organizationId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        // Create user in database
        const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name: name || email.split('@')[0],
            organizationId
        },
        select: {
            id: true,
            email: true,
            name: true,
            organizationId: true,
            createdAt: true
        }
        })

        // Create JWT token
        const token = await new SignJWT({
        userId: user.id,
        email: user.email,
        organizationId: user.organizationId
        })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET)

        // Return success
        return c.json({
        message: 'User registered',
        user,
        token
        }, 201)
        
    } catch (error) {
        console.error('Registration error:', error)
        return c.json({ error: 'Registration failed' }, 500)
    }
})

export { app as authRoutes }