import type { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { getQuotes, getSparkline } from '../services/market.service'

const prisma = new PrismaClient()

const addSchema = z.object({
  ticker: z.string().min(1).toUpperCase(),
})

async function resolveUser(clerkId: string, res: Response) {
  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) { res.status(404).json({ error: 'User not found' }); return null }
  return user
}

export async function addToWatchlist(req: Request, res: Response): Promise<void> {
  const parsed = addSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const user = await resolveUser(req.userId, res)
  if (!user) return

  const { ticker } = parsed.data

  let companyName = ticker
  try {
    const { getQuote } = await import('../services/market.service')
    const q = await getQuote(ticker)
    companyName = q.companyName
  } catch { /* fallback to ticker */ }

  const item = await prisma.watchlistItem.upsert({
    where: { userId_ticker: { userId: user.id, ticker } },
    update: { companyName },
    create: { userId: user.id, ticker, companyName },
  })

  res.status(201).json(item)
}

export async function getWatchlist(req: Request, res: Response): Promise<void> {
  const user = await resolveUser(req.userId, res)
  if (!user) return

  const items = await prisma.watchlistItem.findMany({
    where: { userId: user.id },
    orderBy: { addedAt: 'desc' },
  })

  if (items.length === 0) { res.json([]); return }

  const tickers = items.map((i) => i.ticker)
  const quotes  = await getQuotes(tickers)

  const sparklines = new Map<string, number[]>()
  for (const item of items) {
    sparklines.set(item.ticker, await getSparkline(item.ticker))
  }

  const enriched = items.map((item) => {
    const q = quotes.get(item.ticker)
    return {
      id:            item.id,
      ticker:        item.ticker,
      companyName:   item.companyName,
      price:         q?.price ?? 0,
      change:        q?.change ?? 0,
      changePercent: q?.changePercent ?? 0,
      sparkline:     sparklines.get(item.ticker) ?? [],
    }
  })

  res.json(enriched)
}

export async function removeFromWatchlist(req: Request, res: Response): Promise<void> {
  const user = await resolveUser(req.userId, res)
  if (!user) return

  const { id } = req.params
  const item = await prisma.watchlistItem.findFirst({ where: { id, userId: user.id } })
  if (!item) { res.status(404).json({ error: 'Watchlist item not found' }); return }

  await prisma.watchlistItem.delete({ where: { id } })
  res.json({ success: true })
}
