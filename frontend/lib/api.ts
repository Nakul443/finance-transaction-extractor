import axios from 'axios'
import { getSession, signOut } from "next-auth/react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
})

// Request Interceptor
api.interceptors.request.use(async (config) => {
    // 1. Get the session. Auth.js v5 caches this nicely in the browser.
    const session = await getSession()
    
    const token = (session as any)?.accessToken
    const orgId = (session?.user as any)?.organizationId

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    // 2. Add Org ID header if your backend uses it for multi-tenancy
    if (orgId) {
        config.headers['x-organization-id'] = orgId
    }

    return config
}, (error) => {
    return Promise.reject(error)
})

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // If we get a 401, the JWT is likely expired or the secret changed
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                console.warn("Session expired. Signing out...")
                await signOut({ callbackUrl: '/login' })
            }
        }
        return Promise.reject(error)
    }
)

export const authAPI = {
    register: (data: { email: string; password: string; name?: string }) =>
        api.post('/api/auth/register', data),
}

export const transactionAPI = {
    // NEW: Chat with the AI Agent
    chat: (message: string) => 
        api.post('/api/transactions/chat', { message }),

    extract: (text: string) =>
        api.post('/api/transactions/extract', { text }),

    delete: (id: string) => api.delete(`/api/transactions/${id}`),

    list: (limit = 10, cursor?: string) =>
        api.get('/api/transactions', { params: { limit, cursor } }),
}

export default api