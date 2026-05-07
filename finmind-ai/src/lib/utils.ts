import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

// Single place to change how all money numbers are displayed across the app
export function formatCompact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_00_00_000) return `₹${+( value / 1_00_00_000).toFixed(2)}Cr`
  if (abs >= 1_00_000)    return `₹${+(value / 1_00_000).toFixed(2)}L`
  if (abs >= 1_000)       return `₹${+(value / 1_000).toFixed(1)}K`
  return `₹${value}`
}
