# 🏦 Vessify - Financial Transaction Extractor

> A secure, multi-tenant financial transaction extraction platform that transforms raw bank SMS/statements into structured JSON data using intelligent regex-based parsing.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Hono](https://img.shields.io/badge/Hono-FF6E30?style=flat)](https://hono.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture & Data Isolation](#-architecture--data-isolation)
- [Authentication & Frontend Setup](#-authentication--frontend-setup)
- [API Documentation](#-api-documentation)
- [Setup Instructions](#-setup-instructions)
- [Environment Variables](#-environment-variables)
- [Testing](#-testing)
- [Project Structure](#-project-structure)

---

## 🎯 Overview

Vessify is a production-ready financial transaction extraction system designed for multi-tenant environments. It securely processes bank statements and SMS notifications, extracting structured transaction data (amount, date, merchant, category) with confidence scoring. Built with enterprise-grade security practices, including JWT-based authentication and logical data isolation to ensure complete tenant separation.

### Key Capabilities

- **Intelligent Text Parsing**: Regex-based extraction engine that identifies amounts, dates, merchants, and categories from unstructured bank text
- **Multi-Tenant Architecture**: Complete data isolation using `organizationId` scoping at the database query level
- **Secure Authentication**: JWT-based auth with password hashing (bcrypt) and token expiration
- **Cursor-Based Pagination**: Efficient transaction listing with cursor pagination for large datasets
- **Real-Time Confidence Scoring**: Each extraction includes a confidence score (0.0-1.0) indicating parsing reliability

---

## ✨ Features

- 🔐 **Secure Authentication**: JWT tokens with 7-day expiration, password hashing via bcrypt
- 🏢 **Multi-Tenant Support**: Logical data isolation ensuring users can only access their own organization's data
- 📊 **Smart Extraction**: Parses dates, amounts, merchants, categories, and balance information from raw text
- 🎯 **Category Detection**: Automatic categorization (Food & Dining, Transport, Shopping, Utilities)
- 📄 **Transaction Management**: Create, list, and delete transactions with full CRUD operations
- 🔄 **Cursor Pagination**: Efficient pagination for large transaction lists
- 🎨 **Modern UI**: Beautiful Next.js 14 interface with Tailwind CSS and shadcn/ui components
- ✅ **Type-Safe**: Full TypeScript coverage across frontend and backend
- 🧪 **Test Coverage**: Unit and integration tests for extraction logic and data isolation

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Authentication**: Auth.js (NextAuth.js) with Credentials provider
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui, Radix UI
- **Form Management**: react-hook-form with zod validation
- **State Management**: React Hooks, Auth.js Session
- **HTTP Client**: Axios with interceptors
- **Notifications**: Sonner (toast notifications)
- **Icons**: Lucide React

### Backend
- **Framework**: Hono.js 4.x (lightweight, fast web framework)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma 6.x
- **Authentication**: JWT (jose library)
- **Password Hashing**: bcryptjs
- **Validation**: Zod
- **Testing**: Vitest

### Infrastructure
- **Database**: PostgreSQL (via Prisma)
- **Development**: tsx (TypeScript execution)
- **Package Manager**: npm

---

## 🏗 Architecture & Data Isolation

### Multi-Tenant Data Isolation Strategy

Vessify implements **Logical Isolation** using a unique `organizationId` per user. This ensures complete data separation at the database query level.

#### How It Works

1. **User Registration**: Each new user receives a unique `organizationId` (format: `org_{timestamp}_{random}`)
2. **JWT Token**: The token includes `userId`, `email`, and `organizationId` for request context
3. **Middleware Protection**: `authMiddleware` verifies JWT and attaches user context to requests
4. **Query Scoping**: All database queries automatically filter by both `userId` AND `organizationId`

#### Example: Data Isolation in Action

```typescript
// In transactions.ts route handler
const user = c.get('user') as AuthenticatedUser

// All queries are scoped to user's organization
const where = {
    userId: user.id,
    organizationId: user.organizationId  // ← Critical for isolation
}

const transactions = await prisma.transaction.findMany({ where })
```

**Result**: User A with `org_123` cannot access transactions from User B with `org_456`, even if they attempt to manipulate API requests.

#### Security Layers

1. **Authentication Middleware**: Validates JWT token and verifies user exists in database
2. **Request Context**: User info (`id`, `email`, `organizationId`) attached to request context
3. **Database Indexes**: Optimized queries with indexes on `organizationId` and `userId`
4. **Cascade Deletion**: Transactions are deleted when user is removed (Prisma `onDelete: Cascade`)

---

## 🔐 Authentication & Frontend Setup

Vessify uses **Auth.js (NextAuth.js)** for frontend authentication, providing a seamless integration between the Next.js frontend and the Hono backend JWT system.

### Auth.js Configuration

#### 1. Auth.js Setup (`frontend/auth.ts`)

The Auth.js configuration uses the Credentials provider to authenticate against the Hono backend:

```typescript
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Calls Hono backend /api/auth/login endpoint
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
          method: 'POST',
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" }
        })

        const data = await res.json()

        if (res.ok && data.user) {
          return {
            ...data.user,
            accessToken: data.token // JWT from Hono backend
          }
        }
        return null
      }
    })
  ],
  callbacks: {
    // Syncs Hono JWT with Auth.js session
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken
        token.organizationId = (user as any).organizationId
      }
      return token
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).organizationId = token.organizationId;
      return session
    }
  }
})
```

**Key Features:**
- **Credentials Provider**: Authenticates against Hono backend `/api/auth/login`
- **JWT Callback**: Stores `accessToken` and `organizationId` in the JWT token
- **Session Callback**: Exposes `accessToken` and `organizationId` in the session object

#### 2. Auth API Route (`frontend/app/api/auth/[...nextauth]/route.ts`)

The Next.js API route exports GET and POST handlers for Auth.js:

```typescript
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

This creates the `/api/auth/*` endpoints that Auth.js uses for authentication flows.

#### 3. Application Providers (`frontend/components/Providers.tsx`)

A client component that wraps the app with `SessionProvider`:

```typescript
'use client'

import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}
```

**Usage in `app/layout.tsx`:**
```typescript
import { Providers } from "@/components/Providers"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
```

This enables `useSession()` hook throughout the application.

#### 4. Middleware Protection (`frontend/app/middleware.ts`)

Protects routes at the edge, redirecting unauthenticated users:

```typescript
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req: { auth: any; nextUrl?: URL }) => {
  const isLoggedIn = !!req.auth
  const nextUrl = req.nextUrl

  if (!nextUrl) {
    return NextResponse.next()
  }

  const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

**Protected Routes:**
- `/dashboard` - Requires authentication
- Root `/` - Redirects to dashboard (which requires auth)

**Public Routes:**
- `/login` - Public access
- `/register` - Public access
- `/api/*` - API routes excluded from middleware

### Frontend Implementation Details

#### 5. Shadcn UI Components

Install required components via Shadcn CLI:

```bash
cd frontend
npx shadcn@latest add table
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add label
npx shadcn@latest add card
```

These components provide the modern UI for forms, tables, and inputs.

#### 6. Login & Register Pages

Both pages use `react-hook-form` and `zod` for validation, replacing manual `fetch` calls:

**Login Page (`app/login/page.tsx`):**
- Uses `react-hook-form` with `zod` resolver
- Calls `signIn()` from Auth.js instead of direct API calls
- Automatic redirect to `/dashboard` on success

**Register Page (`app/register/page.tsx`):**
- Form validation via `zod` schema
- Calls backend `/api/auth/register` endpoint
- Auto-login after registration using `signIn()`

#### 7. Dashboard Implementation (`app/dashboard/page.tsx`)

The dashboard uses Auth.js session management:

```typescript
import { useSession } from "next-auth/react"

export default function DashboardPage() {
  const { data: session } = useSession()
  const user = session?.user

  // No localStorage needed - session is managed by Auth.js
  // Transaction list uses Shadcn Table component
  // Pagination with "Load More" button
  // Delete functionality with state updates
}
```

**Key Features:**
- **Session Management**: Uses `useSession()` hook instead of `localStorage`
- **Transaction Table**: Rendered with Shadcn `Table` component
- **Pagination**: Cursor-based pagination with "Load More" button
- **Delete Handler**: Calls `transactionAPI.delete()` and updates local state

#### 8. API Interceptor Sync (`lib/api.ts`)

The Axios interceptor automatically injects the JWT token from Auth.js session:

```typescript
import { getSession, signOut } from "next-auth/react"

api.interceptors.request.use(async (config) => {
  const session = await getSession()
  const token = (session as any)?.accessToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired - sign out and redirect
      await signOut({ callbackUrl: '/login' })
    }
    return Promise.reject(error)
  }
)
```

**Benefits:**
- Automatic token injection from Auth.js session
- No manual `localStorage` token management
- Automatic logout on 401 errors

#### 9. Data Isolation Verification

The backend automatically extracts `organizationId` from the validated JWT:

1. **Frontend**: `accessToken` (JWT) sent in `Authorization: Bearer <token>` header
2. **Backend Middleware**: `authMiddleware` verifies JWT and extracts `organizationId`
3. **Query Scoping**: All database queries filter by `organizationId` from JWT payload

**Example Flow:**
```typescript
// Frontend: Dashboard calls transactionAPI.list()
// → Axios interceptor adds: Authorization: Bearer <jwt_token>

// Backend: authMiddleware verifies JWT
const { payload } = await jwtVerify(token, JWT_SECRET)
// payload contains: { userId, email, organizationId }

// Backend: Transaction route scopes query
const where = {
  userId: user.id,
  organizationId: user.organizationId  // From JWT payload
}
```

#### 10. Pagination & Deletion

**Pagination Implementation:**
```typescript
const [pagination, setPagination] = useState({
  hasMore: false,
  nextCursor: null as string | null,
  total: 0
})

const loadMore = async () => {
  if (!pagination.nextCursor) return
  
  const response = await transactionAPI.list(10, pagination.nextCursor)
  setTransactions([...transactions, ...response.data.transactions])
  setPagination(response.data.pagination)
}
```

**Delete Handler:**
```typescript
const handleDelete = async (id: string) => {
  try {
    await transactionAPI.delete(id)
    setTransactions(transactions.filter(t => t.id !== id))
    toast.success('Transaction deleted')
  } catch (error) {
    toast.error('Failed to delete transaction')
  }
}
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:3001
```

### Authentication Endpoints

#### `POST /api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"  // optional
}
```

**Response (201):**
```json
{
  "message": "User registered",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "organizationId": "org_1234567890_abc123",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### `POST /api/auth/login`
Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "organizationId": "org_1234567890_abc123"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401`: Invalid credentials
- `400`: Validation error (email format, password length)

---

### Transaction Endpoints

> **Note**: All transaction endpoints require authentication via `Authorization: Bearer <token>` header.

#### `POST /api/transactions/extract`
Extract and save a transaction from raw text.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Paid Rs. 500.00 to Zomato at 12:00 PM. Balance: Rs. 18,420.50"
}
```

**Response (201):**
```json
{
  "message": "Transaction saved successfully",
  "transaction": {
    "id": "clx...",
    "date": "2024-01-01T12:00:00.000Z",
    "description": "Zomato",
    "amount": -500.00,
    "category": "Food & Dining",
    "confidence": 0.9,
    "balanceAfter": 18420.50,
    "rawText": "Paid Rs. 500.00 to Zomato at 12:00 PM. Balance: Rs. 18,420.50",
    "userId": "clx...",
    "organizationId": "org_1234567890_abc123",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "extractionDetails": {
    "confidence": 0.9,
    "category": "Food & Dining"
  }
}
```

**Extraction Capabilities:**
- **Date Parsing**: Handles formats like `DD-MM-YY`, `DD MMM YYYY`
- **Amount Detection**: Recognizes `Rs.`, `INR`, `debited`, `spent` patterns
- **Merchant Extraction**: Identifies merchant names from common patterns
- **Balance Detection**: Extracts balance information when available
- **Category Classification**: Auto-categorizes based on keywords (Swiggy→Food, Uber→Transport, etc.)

#### `GET /api/transactions`
List transactions with cursor-based pagination.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `limit` (optional, default: 10): Number of transactions per page
- `cursor` (optional): Transaction ID to start pagination from

**Example Request:**
```
GET /api/transactions?limit=10&cursor=clx1234567890
```

**Response (200):**
```json
{
  "transactions": [
    {
      "id": "clx...",
      "date": "2024-01-01T12:00:00.000Z",
      "description": "Zomato",
      "amount": -500.00,
      "category": "Food & Dining",
      "confidence": 0.9,
      "balanceAfter": 18420.50,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "hasMore": true,
    "nextCursor": "clx9876543210",
    "total": 42
  }
}
```

#### `DELETE /api/transactions/:id`
Delete a transaction (only if owned by authenticated user).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200):**
```json
{
  "message": "Deleted successfully"
}
```

**Error Responses:**
- `401`: Unauthorized (missing/invalid token)
- `400`: Transaction not found or not owned by user

---

### Health Check

#### `GET /health`
Check server status.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js**: v18+ (LTS recommended)
- **PostgreSQL**: v14+ (local or cloud instance)
- **npm**: v9+ (comes with Node.js)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the `backend` directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/vessify_db"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   PORT=3001
   ```

4. **Set up database:**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate

   # Push schema to database (creates tables)
   npx prisma db push

   # (Optional) Open Prisma Studio to view data
   npm run prisma:studio
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

   Server will run on `http://localhost:3001`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the `frontend` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:3000`

### Verify Installation

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3001/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Frontend:**
   Open `http://localhost:3000` in your browser. You should see the login page.

3. **Test Registration:**
   - Navigate to `/register`
   - Create an account
   - You should be redirected to `/dashboard` after successful registration

---

## 🔐 Environment Variables

### Backend (`.env`)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes | - |
| `JWT_SECRET` | Secret key for JWT token signing | ✅ Yes | `dev-secret` |
| `PORT` | Server port | ❌ No | `3001` |

**Example `.env`:**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/vessify_db"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars-recommended"
PORT=3001
```

### Frontend (`.env.local`)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | ✅ Yes | `http://localhost:3001` |
| `AUTH_SECRET` | Secret key for Auth.js session encryption | ✅ Yes (production) | Generated automatically in dev |

**Example `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
AUTH_SECRET=your-auth-secret-key-min-32-chars
```

> **Note**: `AUTH_SECRET` is required for production. In development, Auth.js will generate one automatically. Generate a secure secret with: `openssl rand -base64 32`

> **⚠️ Security Note**: Never commit `.env` or `.env.local` files to version control. Add them to `.gitignore`.

---

## 🧪 Testing

Vessify includes comprehensive test coverage for extraction logic and data isolation.

### Running Tests

```bash
cd backend
npm test
```

### Test Coverage

The test suite (`backend/src/__tests__/isolation.test.ts`) includes **6 test cases**:

1. **Extraction Test**: Verifies correct parsing of amounts and merchants from SMS text
2. **Category Assignment**: Tests automatic category detection based on keywords
3. **Data Isolation Logic**: Ensures `organizationId` is properly attached to transactions
4. **Auth Middleware**: Validates Bearer token requirement
5. **Validation**: Tests graceful handling of empty/invalid input
6. **Pagination**: Verifies cursor-based pagination parameters

### Example Test Output

```
✓ Transaction Extraction (2)
  ✓ should extract correct amount and merchant from a standard SMS
  ✓ should assign correct category based on keywords

✓ Data Isolation Logic (1)
  ✓ should verify that transactions have organizationId attached

✓ Auth Test (1)
  ✓ should reject requests with missing Bearer token

✓ Validation Test (1)
  ✓ should handle empty text gracefully in extractor

✓ Schema Test (1)
  ✓ should ensure the organizationId is a required string

✓ Pagination Test (1)
  ✓ should support limit and cursor parameters

Test Files  1 passed (1)
     Tests  6 passed (6)
```

---

## 📁 Project Structure

```
Vessify-Assignment/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema (User, Transaction models)
│   ├── src/
│   │   ├── __tests__/
│   │   │   └── isolation.test.ts  # Test suite (6 tests)
│   │   ├── lib/
│   │   │   ├── db.ts              # Prisma client instance
│   │   │   └── extractor.ts       # Transaction extraction logic
│   │   ├── middleware/
│   │   │   └── auth.ts            # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.ts            # Registration, login endpoints
│   │   │   └── transactions.ts    # Transaction CRUD endpoints
│   │   ├── app.ts                 # Hono app setup, route registration
│   │   └── index.ts               # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts    # Auth.js API route handlers
│   │   ├── login/
│   │   │   └── page.tsx            # Login page (react-hook-form + zod)
│   │   ├── register/
│   │   │   └── page.tsx            # Registration page (react-hook-form + zod)
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Main dashboard (useSession, Shadcn Table)
│   │   ├── layout.tsx               # Root layout with Providers (SessionProvider)
│   │   └── middleware.ts            # Route protection middleware
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components (table, form, input, etc.)
│   │   ├── Providers.tsx            # SessionProvider wrapper
│   │   └── auth-provider.tsx        # Legacy auth provider (optional)
│   ├── lib/
│   │   ├── api.ts                   # Axios instance with Auth.js token injection
│   │   └── auth/
│   │       └── client.ts           # Better Auth client config (legacy)
│   ├── auth.ts                      # Auth.js configuration (Credentials provider)
│   ├── package.json
│   └── tsconfig.json
│
└── README.md                       # This file
```

### Key Files Explained

- **`backend/prisma/schema.prisma`**: Defines `User` and `Transaction` models with relationships and indexes
- **`backend/src/middleware/auth.ts`**: JWT verification middleware that enforces authentication and attaches user context
- **`backend/src/routes/transactions.ts`**: Transaction endpoints with data isolation via `organizationId` scoping
- **`backend/src/lib/extractor.ts`**: Regex-based parser that extracts structured data from raw bank text
- **`frontend/auth.ts`**: Auth.js configuration with Credentials provider and JWT/session callbacks
- **`frontend/app/api/auth/[...nextauth]/route.ts`**: Auth.js API route handlers (GET/POST)
- **`frontend/app/middleware.ts`**: Next.js middleware for route protection (redirects unauthenticated users)
- **`frontend/components/Providers.tsx`**: SessionProvider wrapper for Auth.js session management
- **`frontend/lib/api.ts`**: Axios configuration with Auth.js session token injection and 401 error handling
- **`frontend/app/dashboard/page.tsx`**: Main UI using `useSession()` hook, Shadcn Table, and cursor pagination

---

## 🔒 Security Considerations

- **Password Hashing**: All passwords are hashed using bcrypt (10 rounds) before storage
- **JWT Expiration**: Tokens expire after 7 days (configurable)
- **Data Isolation**: All queries are scoped by `organizationId` to prevent cross-tenant access
- **Input Validation**: Zod schemas validate all request bodies
- **CORS**: Configured to allow requests only from `http://localhost:3000` (update for production)
- **SQL Injection Protection**: Prisma ORM prevents SQL injection via parameterized queries

---

## 🚧 Future Enhancements

- [ ] Add transaction editing/updating capability
- [ ] Implement bulk transaction import (CSV/Excel)
- [ ] Add transaction search and filtering
- [ ] Export transactions to PDF/CSV
- [ ] Add transaction analytics and charts
- [ ] Support for multiple bank statement formats
- [ ] Webhook support for real-time transaction updates
- [ ] Rate limiting and API throttling
- [ ] Email verification flow
- [ ] Password reset functionality

---

## 📝 License

ISC

---

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Support

For issues, questions, or contributions, please open an issue on the repository.

---

**Built with ❤️ using Next.js, Hono.js, Prisma, and PostgreSQL**
