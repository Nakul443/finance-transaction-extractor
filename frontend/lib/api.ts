// lib/api.ts
// this file is a HTTP client to call backend endpoints (register, login, transactions, etc.)
// used for all connections to the backend API
// acts as a "phone line" between frontend and backend
// keeps all backend URLs and headers in one place
// also adds authentication token to every request if it exists
// simplifies sending requests to the backend from other parts of the frontend code

// Frontend → api.ts → Backend (localhost:3001)

import axios from 'axios'
// axios is a tool for sending HTTP from a website to a server
import { authClient } from './auth/client' // Import Better Auth client

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
// sets address of backend server, either from environment variable or default to localhost

// create an axios instance with the base URL and default headers
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
})

// Add token to requests
// basically a hook that catches every outgoing request and adds the token to the headers
api.interceptors.request.use(async (config) => {
    if (typeof window !== 'undefined') {
        // check if code is running in a browser
        
        // Get session from Better Auth instead of localStorage
        const session = await authClient.getSession()
        
        if (session?.data?.session?.token) {
            // if token exists in Better Auth session, add it to the request headers
            // put word 'Bearer ' in the front of the token
            config.headers.Authorization = `Bearer ${session.data.session.token}`
        }
    }

    return config
})

// Response interceptor for error handling
// Catches 401 errors and redirects to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear Better Auth session and redirect to login
            authClient.signOut()
            if (typeof window !== 'undefined') {
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

// object authAPI
// the function inside takes data and sends it to the backend API using axios instance created above
export const authAPI = {

    // for registration (Better Auth handles this via authClient.signUp)
    register: (data: { email: string; password: string; name?: string }) =>
        api.post('/api/auth/register', data),

    // for login (Better Auth handles this via authClient.signIn)
    login: (data: { email: string; password: string }) =>
        api.post('/api/auth/login', data),
}

// defines extract data command
export const transactionAPI = {
    // sends a post message to /api/transactions/extract
    // body will contain raw text typed by the user
    extract: (text: string) =>
        api.post('/api/transactions/extract', { text }),

    // defines the get history get API
    list: (limit?: number, cursor?: string) =>
        api.get('/api/transactions', { params: { limit, cursor } }),
}

export default api