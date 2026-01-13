// all API routes are defined in this file
// eg: /login, /transactions
// brain that decides how to respond to requests

import { Hono } from 'hono'
import { cors } from 'hono/cors' // CORS middleware, allows web apps from other domains to access our API
import { authRoutes } from './routes/auth' // authentication routes
import { authMiddleware } from './middleware/auth'

type AppContext = {
  Variables: {
    user: any
  }
}

const app = new Hono<AppContext>()


// enabling CORS
app.use('*', cors({
    origin: ['http://localhost:3000'],
    credentials: true,
}))

// test routes

// route when someone visits the root URL ('/')
app.get('/', (c) => {
    // (c) is context, contains request and response info
    return c.text('Hello, World!')
})

// test route to check if server is running
app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        timestamp: new Date().toISOString() // ISO format timestamp
    })
})

// auth routes
app.route('/api/auth', authRoutes)

// middleware
app.get('/api/protected', authMiddleware, (c) => {
    const user = c.get('user') as any // get user info from context
    return c.json({
        message: 'This is a protected route',
        user
    })
})

export default app