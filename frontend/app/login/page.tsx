// creates a login form for the user to enter email and password
// which is sent to the backend, saves JWT token and redirects to dashboard on success
// flow : User → Type email/password → Click Login → API call to backend → Save token → Go to dashboard
// flow is now NextAuth -> config.ts -> authAPI -> backend


'use client' // tells next.js that this page is interactive

import { useState } from 'react' // way of remembering things in a component
import { useRouter } from 'next/navigation' // allows to change pages (eg : login -> dashboard)
import { signIn } from 'next-auth/react' // NextAuth function to handle login
import { Button } from '@/components/ui/button' // import button component
import { Input } from '@/components/ui/input' // import input component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card' // import card components
import { authAPI } from '@/lib/api' // import authAPI from api.ts
import { toast } from 'sonner' // for showing success/error messages

// main function for the login page
export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('') // store what the user is typing 
    const [password, setPassword] = useState('') // store what the user is typing
    const [loading, setLoading] = useState(false) // loading state for button
    const [error, setError] = useState('') // error message state

    // function that runs when the user submits the form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault() // Prevents the whole page from refreshing
        setLoading(true)   // Shows "Logging in..." on the button
        setError('')       // Clears old errors

        try {
            // use NextAuth signIn to handle authentication
            // this will call authorize() function in lib/auth/config.ts
            // which will call the backend API to verify credentials
            // API call to login endpoint with email and password

            // store the result of signIn function
            const result = await signIn('credentials', {
                email,
                password,
                redurect: false, // don't redirect automatically
            })

            if (result?.error) {
                toast.error('Login failed', { description: 'Invalid email or password' })
            }
            else {
                toast.success('Login successful', { description: 'Welcome back!' })
                router.push('/dashboard') // go to dashboard on success
                router.refresh() // refresh server components to get new session
            }
        }

        catch (err: any) {
            toast.error('something went wrong')
            console.error('Login error:', err)
        } finally {
            // meaning this block always runs at the end no matter what
            setLoading(false) // reset loading state
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Login to Vessify</CardTitle>
                    <CardDescription>Enter your credentials to access your transactions</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm">{error}</div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>

                        <div className="text-center text-sm">
                            Don't have an account?{' '}
                            <a href="/register" className="text-blue-600 hover:underline">
                                Register
                            </a>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}