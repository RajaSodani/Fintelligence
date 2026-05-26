const CATEGORY_RULES: Array<{ keywords: string[]; category: string }> = [
  { keywords: ['zomato', 'swiggy', 'uber eats', 'starbucks', 'dominos', 'mcdonald', 'kfc', 'pizza'], category: 'Food & Dining' },
  { keywords: ['uber', 'ola', 'rapido', 'metro', 'irctc', 'redbus', 'makemytrip'], category: 'Transport' },
  { keywords: ['amazon', 'flipkart', 'myntra', 'nykaa', 'meesho', 'ajio', 'snapdeal'], category: 'Shopping' },
  { keywords: ['netflix', 'spotify', 'hotstar', 'prime video', 'youtube premium', 'apple music', 'jio'], category: 'Subscriptions' },
  { keywords: ['salary', 'credit', 'deposit', 'neft', 'imps', 'dividend', 'interest'], category: 'Income' },
  { keywords: ['electricity', 'water bill', 'gas', 'broadband', 'wifi', 'maintenance'], category: 'Utilities' },
  { keywords: ['rent', 'emi', 'loan', 'insurance', 'premium'], category: 'Housing & Finance' },
  { keywords: ['hospital', 'pharmacy', 'doctor', 'clinic', 'medical'], category: 'Health' },
]

export function categorizeTransaction(name: string): string {
  const lower = name.toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.category
    }
  }
  return 'Other'
}

export function buildTransactionWhere(
  userId: string,
  params: {
    category?: string
    startDate?: string
    endDate?: string
    name?: string
  },
) {
  return {
    userId,
    ...(params.category && { category: params.category }),
    ...(params.name && { name: { contains: params.name, mode: 'insensitive' as const } }),
    ...(params.startDate || params.endDate
      ? {
          date: {
            ...(params.startDate && { gte: new Date(params.startDate) }),
            ...(params.endDate && { lte: new Date(params.endDate) }),
          },
        }
      : {}),
  }
}
