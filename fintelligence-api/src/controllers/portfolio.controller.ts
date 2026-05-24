import type { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { getQuotes, getSparkline } from '../services/market.service'

const prisma = new PrismaClient()

const addHoldingSchema = z.object({
  ticker:      z.string().min(1).toUpperCase(),
  quantity:    z.number().positive(),
  avgBuyPrice: z.number().positive(),
})

async function resolveUser(clerkId: string, res: Response) {
  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) { res.status(404).json({ error: 'User not found' }); return null }
  return user
}

export async function addHolding(req: Request, res: Response): Promise<void> {
  const parsed = addHoldingSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const user = await resolveUser(req.userId, res)
  if (!user) return

  const { ticker, quantity, avgBuyPrice } = parsed.data

  // Try to resolve company name from Yahoo Finance
  let companyName = ticker
  try {
    const { getQuote } = await import('../services/market.service')
    const q = await getQuote(ticker)
    companyName = q.companyName
  } catch { /* use ticker as fallback */ }

  const holding = await prisma.holding.upsert({
    where: { userId_ticker: { userId: user.id, ticker } },
    update: { quantity, avgBuyPrice, companyName },
    create: { userId: user.id, ticker, companyName, quantity, avgBuyPrice },
  })

  res.status(201).json(holding)
}

export async function getHoldings(req: Request, res: Response): Promise<void> {
  const user = await resolveUser(req.userId, res)
  if (!user) return

  const holdings = await prisma.holding.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  })

  if (holdings.length === 0) {
    res.json({ holdings: [], totalValue: 0, totalPnl: 0, totalPnlPercent: 0, dayPnl: 0 })
    return
  }

  const tickers = holdings.map((h) => h.ticker)
  const quotes = await getQuotes(tickers)

  const sparklineEntries = await Promise.all(
    holdings.map(async (h: { ticker: string }) => [h.ticker, await getSparkline(h.ticker)] as const)
  )
  const sparklines = new Map<string, number[]>(sparklineEntries)

  const enriched = holdings.map((h) => {
    const q = quotes.get(h.ticker)
    const ltp          = q?.price ?? 0
    const currentValue = ltp * h.quantity
    const costBasis    = h.avgBuyPrice * h.quantity
    const pnl          = currentValue - costBasis
    const pnlPercent   = costBasis > 0 ? (pnl / costBasis) * 100 : 0
    const dayChange    = (q?.change ?? 0) * h.quantity

    return {
      id:          h.id,
      ticker:      h.ticker,
      companyName: h.companyName,
      quantity:    h.quantity,
      avgBuyPrice: h.avgBuyPrice,
      ltp,
      currentValue,
      pnl,
      pnlPercent,
      dayChange,
      changePercent: q?.changePercent ?? 0,
      sparkline: sparklines.get(h.ticker) ?? [],
    }
  })

  const totalValue      = enriched.reduce((s, h) => s + h.currentValue, 0)
  const totalCost       = enriched.reduce((s, h) => s + h.avgBuyPrice * h.quantity, 0)
  const totalPnl        = totalValue - totalCost
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0
  const dayPnl          = enriched.reduce((s, h) => s + h.dayChange, 0)

  res.json({ holdings: enriched, totalValue, totalPnl, totalPnlPercent, dayPnl })
}

export async function deleteHolding(req: Request, res: Response): Promise<void> {
  const user = await resolveUser(req.userId, res)
  if (!user) return

  const { id } = req.params
  const holding = await prisma.holding.findFirst({ where: { id, userId: user.id } })
  if (!holding) { res.status(404).json({ error: 'Holding not found' }); return }

  await prisma.holding.delete({ where: { id } })
  res.json({ success: true })
}

const importSchema = z.object({
  holdings: z.array(z.object({
    ticker:      z.string().min(1).toUpperCase(),
    quantity:    z.number().positive(),
    avgBuyPrice: z.number().positive(),
    resolution:  z.enum(['overwrite', 'skip', 'add']).default('overwrite'),
  })),
})

export async function importHoldings(req: Request, res: Response): Promise<void> {
  const parsed = importSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const user = await resolveUser(req.userId, res)
  if (!user) return

  const results: { ticker: string; status: 'created' | 'updated' | 'skipped' }[] = []

  for (const item of parsed.data.holdings) {
    const existing = await prisma.holding.findFirst({ where: { userId: user.id, ticker: item.ticker } })

    if (!existing) {
      let companyName = item.ticker
      try {
        const { getQuote } = await import('../services/market.service')
        const q = await getQuote(item.ticker)
        companyName = q.companyName
      } catch { /* fallback to ticker */ }
      await prisma.holding.create({ data: { userId: user.id, ticker: item.ticker, companyName, quantity: item.quantity, avgBuyPrice: item.avgBuyPrice } })
      results.push({ ticker: item.ticker, status: 'created' })
    } else if (item.resolution === 'skip') {
      results.push({ ticker: item.ticker, status: 'skipped' })
    } else if (item.resolution === 'overwrite') {
      await prisma.holding.update({ where: { id: existing.id }, data: { quantity: item.quantity, avgBuyPrice: item.avgBuyPrice } })
      results.push({ ticker: item.ticker, status: 'updated' })
    } else {
      const newQty = existing.quantity + item.quantity
      const newAvg = ((existing.quantity * existing.avgBuyPrice) + (item.quantity * item.avgBuyPrice)) / newQty
      await prisma.holding.update({ where: { id: existing.id }, data: { quantity: newQty, avgBuyPrice: newAvg } })
      results.push({ ticker: item.ticker, status: 'updated' })
    }
  }

  res.json({ imported: results.length, results })
}
