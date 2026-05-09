import type { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns'
import type { TransactionQueryParams } from '../types'
import { buildTransactionWhere } from '../services/transactions.service'

const prisma = new PrismaClient()

export async function getTransactions(req: Request, res: Response): Promise<void> {
  const { limit = '50', offset = '0', category, startDate, endDate } =
    req.query as TransactionQueryParams

  const user = await prisma.user.findUnique({ where: { clerkId: req.userId } })
  if (!user) { res.status(404).json({ error: 'User not found' }); return }

  const where = buildTransactionWhere(user.id, { category, startDate, endDate })

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    }),
    prisma.transaction.count({ where }),
  ])

  res.json({ transactions, total, limit: parseInt(limit), offset: parseInt(offset) })
}

export async function getTransactionSummary(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { clerkId: req.userId } })
  if (!user) { res.status(404).json({ error: 'User not found' }); return }

  const now = new Date()
  const thisMonthStart = startOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))

  const [allTx, thisMonthTx, lastMonthTx] = await Promise.all([
    prisma.transaction.findMany({ where: { userId: user.id, pending: false } }),
    prisma.transaction.findMany({ where: { userId: user.id, pending: false, date: { gte: thisMonthStart } } }),
    prisma.transaction.findMany({ where: { userId: user.id, pending: false, date: { gte: lastMonthStart, lte: lastMonthEnd } } }),
  ])

  const byCategoryMap: Record<string, number> = {}
  for (const tx of allTx) {
    if (tx.amount > 0) {
      const cat = tx.category ?? 'Other'
      byCategoryMap[cat] = (byCategoryMap[cat] ?? 0) + tx.amount
    }
  }
  const byCategory = Object.entries(byCategoryMap).map(([category, total]) => ({ category, total }))

  const monthly: Array<{ month: string; income: number; expenses: number }> = []
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i)
    const start = startOfMonth(d)
    const end = endOfMonth(d)
    const txs = allTx.filter((t) => t.date >= start && t.date <= end)
    const income = txs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
    const expenses = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
    monthly.push({ month: format(d, 'MMM'), income, expenses })
  }

  const thisMonthSpend = thisMonthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const lastMonthSpend = lastMonthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const change = lastMonthSpend > 0 ? ((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100 : 0

  res.json({
    byCategory,
    monthly,
    comparison: {
      thisMonth: thisMonthSpend,
      lastMonth: lastMonthSpend,
      changePercent: parseFloat(change.toFixed(1)),
    },
  })
}

export async function getCashflow(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { clerkId: req.userId } })
  if (!user) { res.status(404).json({ error: 'User not found' }); return }

  const now = new Date()
  const allTx = await prisma.transaction.findMany({ where: { userId: user.id, pending: false } })

  const cashflow: Array<{ month: string; income: number; expenses: number; net: number }> = []
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i)
    const start = startOfMonth(d)
    const end = endOfMonth(d)
    const txs = allTx.filter((t) => t.date >= start && t.date <= end)
    const income = txs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
    const expenses = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
    cashflow.push({ month: format(d, 'MMM yyyy'), income, expenses, net: income - expenses })
  }

  res.json(cashflow)
}
