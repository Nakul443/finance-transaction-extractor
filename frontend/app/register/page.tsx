// User → Enter name/email/password → Click Register →
// api.ts sends to backend → Backend creates user → Returns token → Save token → Redirect to dashboard
// This file sends the data
// The auth.ts backend file receives it
// The backend hashes the password and generates a unique organizationId
// This file receives that organizationId inside the token and saves it

// flow : Register → Backend creates user → Auto-login via NextAuth → Dashboard


'use client' // tells next.js that this page is interactive
// interactive means it can respond to user actions like clicks
// non-interactive pages are static and cannot respond to user actions
// interactive pages need to be rendered on the client side
// non-interactive pages can be rendered on the server side

import { useState } from 'react' // react's memory
import { useRouter } from 'next/navigation' // allows page changes
import { signIn } from 'next-auth/react' // NextAuth function to auto-login after registration
import { Button } from '@/components/ui/button' // import button component
import { Input } from '@/components/ui/input' // import input component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card' // import card components
import { authAPI } from '@/lib/api' // import authAPI from api.ts
import { toast } from 'sonner' // for showing success/error messages


// function for registration page
export default function RegisterPage() {
    const router = useRouter()
    const [email, setEmail] = useState('') // store user's email
    const [password, setPassword] = useState('') // store user's password
    const [name, setName] = useState('') // store user's name
    const [loading, setLoading] = useState(false) // loading state for button
    const [error, setError] = useState('') // error message state

    // function that runs when the user submits the form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault() // Stop the browser from refreshing the page
        setLoading(true)   // Turn the "Loading" switch to ON
        setError('')       // Wipe out any old error messages

        try {
            // API call to register endpoint with email, password and name
            // sends email, password and name to hono backend
            // backend creates the user and returns a token
            const response = await authAPI.register({ email, password, name })

            toast.success('Registration successful, account created successfully!', { description: 'You can now log in' })

            const loginResult = await signIn('credentials', {
                email,
                password,
                redirect: false, // don't redirect automatically
            })

            if (loginResult?.error) {
                // If auto-login fails, redirect to login page
                toast.info('Account created. Please login manually.')
                router.push('/login')
            } else {
                // Success! Redirect to dashboard
                router.push('/dashboard')
                router.refresh() // Refresh server components
            }

        } catch (err: any) {
            // Show error message from backend or generic error
            const errorMessage = err.response?.data?.error || 'Registration failed'
            toast.error(errorMessage)
            console.error('Registration error:', err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>Sign up to start extracting transactions</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Input
                                type="text"
                                placeholder="Full Name (optional)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <Input
                                type="password"
                                placeholder="Password (min 6 characters)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm">{error}</div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Creating account...' : 'Register'}
                        </Button>

                        <div className="text-center text-sm">
                            Already have an account?{' '}
                            <a href="/login" className="text-blue-600 hover:underline">
                                Login
                            </a>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}