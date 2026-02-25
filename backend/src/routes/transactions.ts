// request hits /extract
// -> rate limiter (checks if user has made > 10 in the last minute)
// -> identity retrieval (pulls user data out of AppContext backpack provided by middleware)
// -> input validation (uses zod to ensure incoming JSON contains a valid "text" string)
// -> data extraction (calls extractTransaction to turn messy text into structured numbers and dates)
// -> database command (uses prisma to create a new record tied to the specific userId and organizationId)
// -> response sent

import { Hono } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import { z } from 'zod' // validates incoming data
import { prisma } from '../lib/db'
import { extractTransaction, getTransactionEmbedding } from '../lib/extractor' // logic to read text & AI embedding
import { AuthenticatedUser } from '../middleware/auth'
import { AppContext } from '../app'

// tells hono that every route in this file has access to the "backpack"
const app = new Hono<AppContext>()

// zod used to create a "schema"
// defines what a valid request looks like
// if user doesn't send a 'text' string, reject it
const extractSchema = z.object({
    text: z.string().min(1, 'Text is required'),
})

// rate limiter
// 10 requests every 60 seconds
const ExtractionLimiter = rateLimiter({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    keyGenerator: (c: any) => c.req.header("x-forwarded-for") || "unknown",
    message: { error: "Too many extraction requests, please try again later." },
})

// Extract and save (convert text into a DB record)
app.post('/extract', ExtractionLimiter, async (c) => {
    try {
        // grab user info that authMiddleware verified
        const user = c.get('user') as AuthenticatedUser
        const body = await c.req.json()

        // validates incoming data
        const { text } = extractSchema.parse(body)

        // extract data using the 'extractor' logic
        const extracted = extractTransaction(text)

        // NEW: Generate AI vector embedding for the chatbot to "understand" this transaction
        const vector = await getTransactionEmbedding(extracted.description, extracted.category || 'Other')

        // save transaction to the PostgreSQL database using prisma
        // Logic Update: Using $transaction to ensure both the record and the AI vector are saved
        const transaction = await prisma.$transaction(async (tx) => {
            // Create the record first
            const record = await tx.transaction.create({
                data: {
                    amount: extracted.amount,
                    date: extracted.date,
                    description: extracted.description,
                    category: extracted.category || 'Uncategorized',
                    confidence: extracted.confidence,
                    rawText: text, // Save the actual raw text
                    balanceAfter: extracted.balanceAfter,
                    userId: user.id,
                    organizationId: user.organizationId
                }
            })

            // Logic: Use Raw SQL to save the vector because Prisma doesn't support the 'vector' type natively
            await tx.$executeRaw`
                UPDATE "Transaction"
                SET embedding = ${vector}::vector
                WHERE id = ${record.id}
            `

            return record
        })

        return c.json({ message: 'Transaction saved', transaction }, 201)
    } catch (error) {
        console.error(error) // Helpful for debugging AI connection issues
        return c.json({ error: 'Failed to process transaction' }, 500)
    }
})

// List with Cursor Pagination and Isolation
app.get('/', async (c) => {
    try {
        const user = c.get('user') as AuthenticatedUser

        // get URL parameters
        const limit = parseInt(c.req.query('limit') || '10')
        const cursor = c.req.query('cursor')

        // data isolation
        // only query data belonging to the user's organization
        const where = {
            organizationId: user.organizationId // Data Isolation check
        }

        // fetch records from the database
        const transactions = await prisma.transaction.findMany({
            where,
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { date: 'desc' },
        })

        const hasMore = transactions.length > limit
        const items = hasMore ? transactions.slice(0, -1) : transactions
        const nextCursor = hasMore ? items[items.length - 1]?.id : null

        return c.json({
            transactions: items,
            nextCursor,
            total: await prisma.transaction.count({ where })
        })
    } catch (error) {
        return c.json({ error: 'Internal server error' }, 500)
    }
})

// Delete (Self-Correction: Using organizationId for extra safety)
app.delete('/:id', async (c) => {
    // grab user data authenticated by the middleware
    const user = c.get('user') as AuthenticatedUser
    const id = c.req.param('id') // get ID from URL

    try {
        // delete only if the ID matches and the organizationId matches
        // This prevents User A from deleting user B's transactions
        await prisma.transaction.delete({
            where: { 
                id,
                organizationId: user.organizationId // Prevents cross-tenant deletion
            }
        })
        return c.json({ message: 'Deleted successfully' })
    } catch (error) {
        return c.json({ error: 'Delete failed' }, 400)
    }
})

export { app as transactionRoutes }