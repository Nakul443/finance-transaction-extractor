'use client'

import type { ReactNode } from 'react'

// Simple auth provider wrapper so the app can compile.
// You can later replace this with Better Auth's official React provider
// if you start using hooks like useSession().
export function AuthProvider({ children }: { children: ReactNode }) {
  return children
}


