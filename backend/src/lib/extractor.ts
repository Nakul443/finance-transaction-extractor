// schema of what the output should look like

import { openai } from "@ai-sdk/openai";
import { embed } from "ai";

export interface ExtractedTransaction {
  date: Date
  description: string
  amount: number
  balanceAfter?: number
  confidence: number
  category?: string
  rawText: string
}

// the function parses a raw bank statement text into structured transaction data
// by using a weighted scoring system to improve accuracy
// the point of confidence is to give an idea of how sure we are about the extraction
export function extractTransaction(text: string): ExtractedTransaction {

  // removes extra spaces and creates a lowercase version for easier searching
  const rawText = text.trim()
  const lowerText = rawText.toLowerCase()

  // default values just in case extraction fails
  let date = new Date()
  let description = 'Transaction'
  let amount = 0
  let balanceAfter: number | undefined = undefined
  let category = 'Other'

  // DATE EXTRACTION
  const dateMatch = rawText.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})|(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)/i)
  if (dateMatch) {
    const d = new Date(dateMatch[0])
    if (!isNaN(d.getTime())) {
      date = d
    }
  }

  // Logic Fix: Added [+-]? to capture signs and [,\d] to handle thousands separators

  // AMOUNT EXTRACTION
  const amountPatterns = [
    /(?:rs\.?|inr|amt|amount)\s*:?\s*([+-]?[\d,]+\.?\d*)/i,
    /([+-]?[\d,]+\.?\d*)\s*(?:debited|credited|spent)/i, // Logic: Handles "1,250.00 debited"
    /(?:₹|rs\.?|inr)\s*([+-]?[\d,]+\.?\d*)/i,            // Logic: Handles "₹1,250.00"
    /spent\s*([+-]?[\d,]+\.?\d*)/i
  ]

  for (const pattern of amountPatterns) {
    const match = rawText.match(pattern)
    if (match && match[1]) {
      amount = parseFloat(match[1].replace(/,/g, ''))
      break
    }
  }

  // MERCHANT / DESCRIPTION EXTRACTION
  const merchantMatch = rawText.match(/Description:\s*([^]*?)(?=\n?\s*(?:Amount|Date|Balance|$))/i)

  if (merchantMatch) {
    description = merchantMatch[1].trim()
  } else {
    // Logic: Try to find a merchant between a Date and a Currency/Dr/Cr
    const singleLineMatch = rawText.match(/(?:\d{4}-\d{2}-\d{2}|\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\s+(.*?)(?=\s*(?:₹|Rs\.?|INR|Dr|Cr|$))/i)

    if (singleLineMatch && singleLineMatch[1] && singleLineMatch[1].trim() !== "→") {
      description = singleLineMatch[1].replace(/→/g, '').trim()
    } else {
      // Fallback Logic: Take the very first line of the text
      const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
      const firstLine = lines[0]

      // If the first line isn't just a date, it's our Merchant (e.g., "Uber Ride * Airport Drop")
      if (!firstLine.match(/^\d{1,2}[-/]\d{1,2}/)) {
        description = firstLine
      } else {
        description = "Transaction" // Absolute fallback
      }
    }
  }

  // Cleanup: Remove any stray arrows or extra whitespace from the final description
  description = description.replace(/→/g, '').replace(/\s+/g, ' ').trim()

  // BALANCE DETECTION (Added "Available Balance" keyword)
  const balanceMatch = rawText.match(/(?:bal|balance|available|avl)\s*(?:is|:)?\s*[rs.₹]*\s*([\d,]+\.?\d*)/i)
  if (balanceMatch) {
    balanceAfter = parseFloat(balanceMatch[1].replace(/,/g, ''))
  }

  // CATEGORY DETECTION
  const categoryMap: { [key: string]: string[] } = {
    'Food & Dining': ['swiggy', 'zomato', 'restaurant', 'cafe', 'dine', 'hotel', 'starbucks', 'kfc'],
    'Transport': ['uber', 'ola', 'irctc', 'petrol', 'fuel', 'shell', 'metro'],
    'Shopping': ['amazon', 'flipkart', 'myntra', 'blinkit', 'zepto', 'dmart'],
    'Utilities': ['recharge', 'bill', 'electricity', 'jio', 'airtel', 'insurance']
  }

  for (const [cat, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      category = cat
      break
    }
  }


  // WEIGHTED CONFIDENCE SCORING (The "Logic Upgrade")
  let score = 0

  // Amount is most critical (40%)
  if (amount !== 0) score += 0.4

  // Merchant detection is key (30%)
  if (merchantMatch) score += 0.3

  // Valid date detection (20%)
  if (dateMatch) score += 0.2

  // Metadata bonus (10%)
  if (balanceAfter !== undefined) score += 0.05
  if (category !== 'Other') score += 0.05

  return {
    date,
    description,
    amount,
    balanceAfter,
    confidence: parseFloat(score.toFixed(2)),
    category,
    rawText
  }
}

/**
 * NEW: Converts the transaction description into a mathematical vector.
 * This is used for Semantic Search in the chatbot.
 */
export async function getTransactionEmbedding(description: string, category: string): Promise<number[]> {
  // We combine description and category to give the AI more context
  const textToEmbed = `Transaction: ${description}. Category: ${category}`;

  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: textToEmbed,
  });

  return embedding;
}