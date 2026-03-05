import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authRoutes } from './routes/auth'
import { authMiddleware } from './middleware/auth'
import { transactionRoutes } from './routes/transactions'

export type AppContext = {
    Variables: {
        user: any
    }
}

const app = new Hono<AppContext>()

// 1. TYPE-SAFE DYNAMIC CORS
app.use('*', cors({
  origin: (origin) => origin, // This effectively allows "all" origins dynamically
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-organization-id'],
  exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
  maxAge: 600,
}))

// 2. FIXED OPTIONS HANDLER
// Using c.body(null, 204) fixes the "Argument of type 204 is not assignable" error
app.options('*', (c) => c.body(null, 204))

// 3. BASE ROUTES
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// 4. API ROUTES
app.route('/api/auth', authRoutes)

// Protect transactions
app.use('/api/transactions/*', authMiddleware)
app.route('/api/transactions', transactionRoutes)

export default app