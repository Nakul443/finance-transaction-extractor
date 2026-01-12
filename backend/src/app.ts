// all API routes are defined in this file
// eg: /login, /transactions
// brain that decides how to respond to requests

import { Hono } from 'hono'

const app = new Hono()

// route when someone visits the root URL ('/')
app.get('/', (c) => {
    // (c) is context, contains request and response info
    return c.text('Hello, World!')
})

app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        timestamp: new Date().toISOString() // ISO format timestamp
    })
})

export default app