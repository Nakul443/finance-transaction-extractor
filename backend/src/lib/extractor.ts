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
  const rawText = text.trim()
  const lowerText = rawText.toLowerCase()

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

  // AMOUNT EXTRACTION (Prioritizes currency keywords)
  const amountPatterns = [
    /(?:rs\.?|inr|amt|amount)\s*([\d,]+\.?\d*)/i,  // e.g., Rs. 500
    /spent\s*([\d,]+\.?\d*)/i,                    // e.g., spent 500
    /debited\s*(?:by|with)?\s*([\d,]+\.?\d*)/i    // e.g., debited by 500
  ]

  for (const pattern of amountPatterns) {
    const match = rawText.match(pattern)
    if (match) {
      amount = parseFloat(match[1].replace(/,/g, ''))
      break
    }
  }

  // MERCHANT / DESCRIPTION EXTRACTION
  const merchantMatch = rawText.match(/(?:paid to|at|to|vpa)\s+([^.\n]+?)(?:\s+on|\s+at|\s+using|\s+for|$)/i)
  if (merchantMatch) {
    description = merchantMatch[1].trim()
  } else {
    // Fallback: Take the first line but clean it up
    description = rawText.split('\n')[0].substring(0, 50).trim() + "..."
  }

  // BALANCE DETECTION
  const balanceMatch = rawText.match(/(?:bal|balance|available|avl)\s*(?:is|:)?\s*[rs.]*\s*([\d,]+\.?\d*)/i)
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
  if (amount > 0) score += 0.4

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