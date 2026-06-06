import type { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns'
import type { TransactionQueryParams } from '../types'
import { buildTransactionWhere, categorizeTransaction } from '../services/transactions.service'

const prisma = new PrismaClient()

export async function getTransactions(req: Request, res: Response): Promise<void> {
  const { limit = '50', offset = '0', category, startDate, endDate, name } =
    req.query as TransactionQueryParams

  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) { res.status(404).json({ error: 'User not found' }); return }

  const where = buildTransactionWhere(user.id, { category, startDate, endDate, name })

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
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
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

export async function getNetWorth(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) { res.status(404).json({ error: 'User not found' }); return }

  const accounts = await prisma.account.findMany({ where: { userId: user.id } })

  const ASSET_TYPES = ['depository', 'investment', 'brokerage', 'deposit', 'term_deposit', 'recurring_deposit']
  const LIABILITY_TYPES = ['credit', 'loan']

  const assets = accounts.filter((a) => ASSET_TYPES.includes(a.type.toLowerCase()))
  const liabilities = accounts.filter((a) => LIABILITY_TYPES.includes(a.type.toLowerCase()))

  const totalAssets = assets.reduce((s, a) => s + a.balance, 0)
  const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0)
  const netWorth = totalAssets - totalLiabilities

  if (accounts.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const primaryAccount = accounts[0]
    const existingSnap = await prisma.balanceSnapshot.findFirst({
      where: { accountId: primaryAccount.id, takenAt: { gte: today } },
    })
    if (!existingSnap) {
      await prisma.balanceSnapshot.create({
        data: { accountId: primaryAccount.id, balance: primaryAccount.balance, netWorth },
      })
    }
  }

  const now = new Date()

  // Use stored daily snapshots for trend when available
  const snapshots = await prisma.balanceSnapshot.findMany({
    where: { accountId: { in: accounts.map((a) => a.id) } },
    orderBy: { takenAt: 'asc' },
  })

  const allTx = await prisma.transaction.findMany({ where: { userId: user.id, pending: false } })

  const monthlyNet: number[] = []
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i)
    const start = startOfMonth(d)
    const end = endOfMonth(d)
    const txs = allTx.filter((t) => t.date >= start && t.date <= end)
    const income = txs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
    const expenses = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
    // Only count income if there are actually income transactions — avoid phantom negative savings
    monthlyNet.push(income > 0 ? income - expenses : 0)
  }

  const trendPoints: Array<{ month: string; value: number }> = []
  let running = netWorth
  for (let i = 0; i <= 5; i++) {
    const d = subMonths(now, i)
    // Check if we have a real snapshot near this month
    const monthStart = startOfMonth(d)
    const monthEnd = endOfMonth(d)
    const snap = snapshots.find((s) => s.takenAt >= monthStart && s.takenAt <= monthEnd)
    const value = snap ? snap.netWorth : Math.max(0, Math.round(running))
    trendPoints.unshift({ month: format(d, 'MMM'), value })
    if (!snap) running -= monthlyNet[5 - i] ?? 0
  }

  res.json({
    netWorth,
    totalAssets,
    totalLiabilities,
    accounts: accounts.map((a) => ({ id: a.id, name: a.name, type: a.type, balance: a.balance })),
    trend: trendPoints,
  })
}

export async function getCashflow(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
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

export async function deleteTransaction(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) { res.status(404).json({ error: 'User not found' }); return }

  const tx = await prisma.transaction.findFirst({ where: { id, userId: user.id } })
  if (!tx) { res.status(404).json({ error: 'Transaction not found' }); return }

  await prisma.transaction.delete({ where: { id } })
  res.json({ success: true })
}

export async function updateTransactionCategory(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const { category } = req.body as { category: string }
  if (!category) { res.status(400).json({ error: 'category is required' }); return }

  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) { res.status(404).json({ error: 'User not found' }); return }

  const tx = await prisma.transaction.findFirst({ where: { id, userId: user.id } })
  if (!tx) { res.status(404).json({ error: 'Transaction not found' }); return }

  const updated = await prisma.transaction.update({ where: { id }, data: { category } })
  res.json(updated)
}

export async function createManualTransaction(req: Request, res: Response): Promise<void> {
  const { name, amount, isCredit, category, date } = req.body as {
    name: string; amount: number; isCredit: boolean; category?: string; date: string
  }
  if (!name || amount == null || !date) {
    res.status(400).json({ error: 'name, amount, and date are required' }); return
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) { res.status(404).json({ error: 'User not found' }); return }

  const externalId = `manual-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const tx = await prisma.transaction.create({
    data: {
      userId: user.id,
      externalTxnId: externalId,
      name,
      amount: isCredit ? -Math.abs(amount) : Math.abs(amount),
      category: category ?? categorizeTransaction(name),
      date: new Date(date),
      pending: false,
    },
  })
  res.json(tx)
}

export async function createManualAccount(req: Request, res: Response): Promise<void> {
  const { name, type, balance } = req.body as { name: string; type: string; balance: number }
  if (!name || balance == null) {
    res.status(400).json({ error: 'name and balance are required' }); return
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) { res.status(404).json({ error: 'User not found' }); return }

  const account = await prisma.account.create({
    data: {
      userId: user.id,
      name,
      type: type ?? 'depository',
      balance: parseFloat(String(balance)),
      currency: 'INR',
    },
  })
  res.json(account)
}
