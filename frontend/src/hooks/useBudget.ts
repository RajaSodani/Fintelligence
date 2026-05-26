import { useState, useCallback } from 'react'

export const BUDGET_CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transport',
  'Subscriptions',
  'Utilities',
  'Housing & Finance',
  'Health',
  'Other',
] as const

const DEFAULT_BUDGETS: Record<string, number> = {
  'Food & Dining': 8000,
  'Shopping': 5000,
  'Transport': 3000,
  'Subscriptions': 2000,
  'Utilities': 4000,
  'Housing & Finance': 15000,
  'Health': 3000,
  'Other': 2000,
}

const STORAGE_KEY = 'finmind:budgets'

function load(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_BUDGETS, ...JSON.parse(raw) } : DEFAULT_BUDGETS
  } catch {
    return DEFAULT_BUDGETS
  }
}

export function useBudget() {
  const [budgets, setBudgets] = useState<Record<string, number>>(load)

  const save = useCallback((next: Record<string, number>) => {
    setBudgets(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0)

  return { budgets, save, totalBudget }
}
