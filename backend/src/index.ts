// starts the server, entry point of the server

// imports function that creates an HTTP server from Hono
import { serve } from '@hono/node-server'
// serve is used to create and start the server
// it acts as a bridge between Hono app and Node.js HTTP server

// import routes,logic,etc from app.ts
import app from './app'

import dotenv from 'dotenv'
// to load environment variables from .env file

// Load environment variables from .env file into process.env
dotenv.config()

const port = parseInt(process.env.PORT || '3001')
// get port from environment variable or default to 3001

// creation and starting of HTTP server
serve({
    fetch: app.fetch, // to handle HTTP requests
    port,
}, (info) => {
    // This callback runs when server starts successfully
    console.log(`Server running on http://localhost:${info.port}`)
})