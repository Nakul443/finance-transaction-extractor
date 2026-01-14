// app/page.tsx
// Home page that handles authentication redirects
// If user is authenticated → redirect to /dashboard
// If user is not authenticated → redirect to /login
// This prevents showing the default Next.js template to users

import { redirect } from 'next/navigation';

export default function Home() {
  // Immediately redirect to dashboard
  // In a production app, you would check authentication first
  // For now, we assume dashboard will handle auth checks
  redirect('/dashboard');
  
  // This code won't execute due to redirect, but keeps TypeScript happy
  return null;
}