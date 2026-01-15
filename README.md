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
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui, Radix UI
- **State Management**: React Hooks
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

**Example `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

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
│   │   ├── login/
│   │   │   └── page.tsx            # Login page
│   │   ├── register/
│   │   │   └── page.tsx            # Registration page
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Main dashboard (transaction list, extraction)
│   │   └── layout.tsx              # Root layout with AuthProvider
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   └── auth-provider.tsx       # Auth context provider
│   ├── lib/
│   │   ├── api.ts                  # Axios instance, API functions
│   │   └── auth/
│   │       └── client.ts          # Better Auth client config
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
- **`frontend/lib/api.ts`**: Axios configuration with token injection and 401 error handling
- **`frontend/app/dashboard/page.tsx`**: Main UI for transaction extraction and listing

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
