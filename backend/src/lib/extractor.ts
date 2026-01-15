export interface ExtractedTransaction {
  date: Date
  description: string
  amount: number
  balanceAfter?: number
  confidence: number
  category?: string
  rawText: string
}

export function extractTransaction(text: string): ExtractedTransaction {
  const rawText = text.trim()
  const lowerText = rawText.toLowerCase()

  let date = new Date()
  let description = 'Transaction'
  let amount = 0
  let balanceAfter: number | undefined = undefined
  let confidence = 0.5 // Start lower and earn confidence
  let category = 'Other'

  // 1. Better Date Extraction (handles DD-MM-YY and DD MMM)
  const dateMatch = rawText.match(/(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})|(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)/i)
  if (dateMatch) {
    const d = new Date(dateMatch[0])
    if (!isNaN(d.getTime())) {
      date = d
      confidence += 0.2
    }
  }

  // 2. Specific Amount Extraction
  // This looks for numbers following keywords like "Rs", "INR", or "amounting to"
  const amountPatterns = [
    /(?:rs\.?|inr|amt|amount)\s*([\d,]+\.?\d*)/i,  // Rs. 500
    /spent\s*([\d,]+\.?\d*)/i,                    // spent 500
    /debited\s*(?:by|with)?\s*([\d,]+\.?\d*)/i    // debited by 500
  ]

  for (const pattern of amountPatterns) {
    const match = rawText.match(pattern)
    if (match) {
      amount = parseFloat(match[1].replace(/,/g, ''))
      confidence += 0.2
      break
    }
  }

  // 3. Smart Merchant/Description Extraction
  // Indian Bank Format: "Paid to [Merchant] at [Time]" or "at [Merchant] using UPI"
  const merchantMatch = rawText.match(/(?:paid to|at|to|vpa)\s+([^.\n]+?)(?:\s+on|\s+at|\s+using|\s+for|$)/i)
  if (merchantMatch) {
    description = merchantMatch[1].trim()
    confidence += 0.2
  } else {
    // Fallback: use first 30 chars
    description = rawText.substring(0, 30).replace(/\n/g, ' ') + "..."
  }

  // 4. Balance Detection
  const balanceMatch = rawText.match(/(?:bal|balance|available|avl)\s*(?:is|:)?\s*[rs.]*\s*([\d,]+\.?\d*)/i)
  if (balanceMatch) {
    balanceAfter = parseFloat(balanceMatch[1].replace(/,/g, ''))
    confidence += 0.1
  }

  // 5. Category Keyword Map (Expanded)
  const categoryMap: { [key: string]: string[] } = {
    'Food & Dining': ['swiggy', 'zomato', 'restaurant', 'cafe', 'dine', 'hotel', 'starbucks', 'kfc'],
    'Transport': ['uber', 'ola', 'irctc', 'petrol', 'fuel', 'shell', 'metro'],
    'Shopping': ['amazon', 'flipkart', 'myntra', 'blinkit', 'zepto', 'dmart'],
    'Utilities': ['recharge', 'bill', 'electricity', 'jio', 'airtel', 'insurance']
  }

  for (const [cat, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      category = cat
      confidence += 0.1
      break
    }
  }

  confidence = Math.min(confidence, 1.0)

  return {
    date,
    description,
    amount,
    balanceAfter,
    confidence: parseFloat(confidence.toFixed(2)),
    category,
    rawText
  }
}