// It talks to the database to save/retrieve transactions, ensuring each user only sees their own data

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

export { app as transactionRoutes }