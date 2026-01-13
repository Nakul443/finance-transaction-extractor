// parses raw bank statement text into structured transaction data


export interface ExtractedTransaction {
  date: Date
  description: string
  amount: number
  balanceAfter?: number // '?' means optional
  confidence: number
  category?: string // '?' means optional
  rawText: string
}

// this function is a type of ExtractedTransaction
export function extractTransaction(text: string): ExtractedTransaction {
  const rawText = text.trim()

  // default values
  let date = new Date() // date is a Date object
  let description = 'Transaction'
  let amount = 0
  let balanceAfter: number | undefined = undefined
  let confidence = 0.7
  let category = 'Other'

  // Simple date extraction
  const dateMatch = rawText.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})|(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/)
  if (dateMatch) {
    try {
      date = new Date(dateMatch[0])
      if (!isNaN(date.getTime())) confidence += 0.1
    } catch { }
  }

  // Simple amount extraction
  const amountMatch = rawText.match(/[₹$]?\s*([\d,]+\.?\d*)/)
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ''))
    if (!isNaN(amount)) confidence += 0.1
  }

  // Simple balance extraction
  const balanceMatch = rawText.match(/Balance[^\d]*[₹$]?\s*([\d,]+\.?\d*)/i)
  if (balanceMatch) {
    balanceAfter = parseFloat(balanceMatch[1].replace(/,/g, ''))
    if (!isNaN(balanceAfter)) confidence += 0.1
  }

  // Simple description
  const lines = rawText.split('\n').filter(line =>
    line.trim().length > 0 &&
    !line.match(/Date:|Amount:|Balance:/i) &&
    !line.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/)
  )

  if (lines.length > 0) {
    description = lines[0].substring(0, 100).trim()
    confidence += 0.1
  }

  // Simple category detection
  if (description.toLowerCase().includes('starbucks') || description.toLowerCase().includes('coffee')) {
    category = 'Food & Dining'
  } else if (description.toLowerCase().includes('uber') || description.toLowerCase().includes('ride')) {
    category = 'Transport'
  } else if (description.toLowerCase().includes('amazon') || description.toLowerCase().includes('shopping')) {
    category = 'Shopping'
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