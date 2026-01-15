'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        console.log("🚀 Starting login for:", email)

        try {
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log("📩 Backend Response:", data);

            if (response.ok && data.token) {
                console.log("✅ Token received! Saving to storage...");
                
                // 1. Save keys to browser memory
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                toast.success('Login successful!');

                // 2. FORCE Redirect
                // We use window.location.href to force a full refresh of the auth state
                window.location.href = '/dashboard';
            } else {
                // 3. Handle backend errors (Wrong password, etc)
                const errorMsg = data.error || 'Invalid email or password';
                toast.error(errorMsg);
                console.error("❌ Login failed:", errorMsg);
            }
        } catch (err: any) {
            // 4. Handle Network errors (Backend down)
            toast.error('Cannot connect to server. Is the backend running?');
            console.error('🔥 Critical Network Error:', err);
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Login to Vessify</CardTitle>
                    <CardDescription>Enter your credentials</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...</> : 'Login'}
                        </Button>
                        <div className="text-center text-sm">
                            Don't have an account? <a href="/register" className="text-blue-600 hover:underline">Register</a>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}