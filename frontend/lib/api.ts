import axios from 'axios'
import { getSession, signOut } from "next-auth/react" // Import Auth.js session helpers

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
})

// Add token to requests using Auth.js Session
api.interceptors.request.use(async (config) => {
    // getSession works in the browser and finds the Auth.js cookie
    const session = await getSession()
    
    // We cast to 'any' because we added accessToken to the session in auth.ts
    const token = (session as any)?.accessToken

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // If the backend says the token is expired/invalid
            if (typeof window !== 'undefined') {
                // Tell Auth.js to log us out and go to login page
                await signOut({ callbackUrl: '/login' })
            }
        }
        return Promise.reject(error)
    }
)

// Auth API (Note: Login/Register will now mostly be handled by Auth.js signIn)
export const authAPI = {
    register: (data: { email: string; password: string; name?: string }) =>
        api.post('/api/auth/register', data),

    login: (data: { email: string; password: string }) =>
        api.post('/api/auth/login', data),
}

export const transactionAPI = {
    extract: (text: string) =>
        api.post('/api/transactions/extract', { text }),

    delete: (id: string) => api.delete(`/api/transactions/${id}`),

    list: (limit?: number, cursor?: string) =>
        api.get('/api/transactions', { params: { limit, cursor } }),
}

export default api