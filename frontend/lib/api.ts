// this file is a HTTP client to call backend endpoints (register, login, transactions, etc.)
// used for all connections to the backend API
// acts as a "phone line" between frontend and backend
// keeps all backend URLs and headers in one place
// also adds authentication token to every request if it exists
// simplifies sending requests to the backend from other parts of the frontend code

import axios from 'axios'
// axios is a tool for sending HTTP from a website to a server

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
// basially a hook that catches every outgoing request and adds the token to the headers
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        // check if code is running in a browser

        const token = localStorage.getItem('token') // get token from local storage

        if (token) {
            // if token exists, add it to the request headers
            // put word 'Bearer ' in the front of the token
            config.headers.Authorization = `Bearer ${token}`
        }
    }

    return config
})

// object authAPI
// the function inside takes data and sends it to the backend API using axios instance created above
export const authAPI = {

    // for registration
    register: (data: { email: string; password: string; name?: string }) =>
        api.post('/api/auth/register', data),

    // for login
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