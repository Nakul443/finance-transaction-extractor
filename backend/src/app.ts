// all API routes are defined in this file
// eg: /login, /transactions
// brain that decides how to respond to requests

// 1.
// gathers pieces of logic (like authRoutes, transactionRoutes)
// and maps them to specific URL paths (like /api/auth)

// 2.
// authMiddleware checks if a user is logged in before letting them see transactions


// request arrives -> CORS layer checks if the request is from http://localhost:3000 (proceeds, if yes)
// -> server looks at the URL and matches the API pattern -> auth middleware performs check -> if valid
// -> middleware puts data into AppContext backpack -> uses the API -> response sent to user

import { Hono } from 'hono'
import { cors } from 'hono/cors' // CORS middleware, allows web apps from other domains to access our API
import { authRoutes } from './routes/auth' // authentication routes
import { authMiddleware } from './middleware/auth'
import { transactionRoutes } from './routes/transactions'

// allows to store data at an early stage and carry it forward to a later stage
// "shared backpack" for a single request
// unique to each specific request
// user A will have his own backpack and user B his own
export type AppContext = {
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

// '*' means apply to every single request, global configuration
app.use('/api/transactions/*', authMiddleware) // protect all /transactions routes with auth
// this line is optional and can be removed if already protected in the transactions route file inside each API

// takes collection of routes from another file and attaches them to a prefix
// keeps the main file clean and readable
app.route('/api/transactions', transactionRoutes)

// middleware
app.get('/api/protected', authMiddleware, (c) => {
    const user = c.get('user') as any // get user info from context
    return c.json({
        message: 'This is a protected route',
        user
    })
})

export default app