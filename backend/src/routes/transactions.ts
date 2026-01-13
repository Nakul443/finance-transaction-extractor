// It talks to the database to save/retrieve transactions, ensuring each user only sees their own data
// Uses an extractor to parse raw transaction text into structured data

import { Hono } from 'hono'
import { z } from 'zod'
import { prisma } from '../lib/db'
import { extractTransaction } from '../lib/extractor'
import { AuthenticatedUser, authMiddleware } from '../middleware/auth'
// Add this type import
import { AppContext } from '../app'

// const user = c.get('user') as AuthenticatedUser

const app = new Hono<AppContext>()

// validation schema for transaction creation
const extractSchema = z.object({
    text: z.string().min(1, 'Text is required'),
})

// extract and save transaction endpoint
app.post('/extract', async (c) => {
    try {

        // get user from context, 'c' is the context
        const user = c.get('user') as AuthenticatedUser

        // get JSON body from request
        const body = await c.req.json()
        const { text } = extractSchema.parse(body)

        // use extractor to parse raw data into structured format
        const extracted = extractTransaction(text)

        // save transaction to database
        const transaction = await prisma.transaction.create({
            data: {
                amount: extracted.amount,
                date: extracted.date,
                description: extracted.description,
                category: extracted.category || 'Uncategorized',
                confidence: extracted.confidence,
                rawText: extracted.rawText,
                balanceAfter: extracted.balanceAfter,
                userId: user.id,
                organizationId: user.organizationId
            }
        })

        // return saved transaction
        return c.json({
            message: 'Transaction saved successfully',
            transaction,
            extractionDetails: {
                confidence: extracted.confidence,
                category: extracted.category
            }
        }, 201)

    } catch (error) {
        console.error('Error extracting transaction:', error)
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Validation error', details: error.issues }, 400)
        }
        return c.json({ error: 'Internal server error' }, 500)
    }
})

// get api with cursor pagination
app.get('/', async (c) => {
    try {
        // 'c' is the context, which holds request and response info
        // get user from context
        const user = c.get('user') as any

        // Get query parameters
        const limit = parseInt(c.req.query('limit') || '10')
        const cursor = c.req.query('cursor')

        // Build query with data isolation
        // the database will only return transactions if it belongs to that user and their organization
        // multi-tenancy
        const where = {
            userId: user.id,
            organizationId: user.organizationId
        }

        // Fetch transactions
        const transactions = await prisma.transaction.findMany({
            where, // only fetch transactions for this user and their organization, data isolation
            take: limit + 1, // Get one extra to check if there are more, simple checking
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { date: 'desc' },
            select: {
                id: true,
                date: true,
                description: true,
                amount: true,
                category: true,
                confidence: true,
                balanceAfter: true,
                createdAt: true
            }
        })

        // Check if there are more transactions
        const hasMore = transactions.length > limit // tells frontend where to show "load more" button
        const items = hasMore ? transactions.slice(0, -1) : transactions // remove extra item if exists
        const nextCursor = hasMore ? items[items.length - 1]?.id : null
        // take ID of last item in our list, frontend will send this ID back when user clicks "load more"

        // response
        return c.json({
            transactions: items,
            pagination: {
                limit,
                hasMore,
                nextCursor,
                total: await prisma.transaction.count({ where })
            }
        })

    } catch (error) {
        console.error('Error fetching transactions:', error)
        return c.json({ error: 'Failed to fetch transactions' }, 500)
    }
})

export { app as transactionRoutes }