import type { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { getQuote } from '../services/market.service'

const prisma = new PrismaClient()

const createAlertSchema = z.object({
  ticker:      z.string().min(1).toUpperCase(),
  targetPrice: z.number().positive(),
  condition:   z.enum(['ABOVE', 'BELOW']),
})

async function resolveUser(clerkId: string, res: Response) {
  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) { res.status(404).json({ error: 'User not found' }); return null }
  return user
}

export async function createAlert(req: Request, res: Response): Promise<void> {
  const parsed = createAlertSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }

  const user = await resolveUser(req.userId, res)
  if (!user) return

  const alert = await prisma.priceAlert.create({
    data: { userId: user.id, ...parsed.data },
  })

  res.status(201).json(alert)
}

export async function getAlerts(req: Request, res: Response): Promise<void> {
  const user = await resolveUser(req.userId, res)
  if (!user) return

  const alerts = await prisma.priceAlert.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  if (alerts.length === 0) { res.json([]); return }

  const enriched = await Promise.all(
    alerts.map(async (alert) => {
      let currentPrice = 0
      try {
        const q = await getQuote(alert.ticker)
        currentPrice = q.price
      } catch { /* fallback to 0 */ }

      const distancePercent =
        currentPrice > 0
          ? Math.abs((alert.targetPrice - currentPrice) / currentPrice) * 100
          : null

      return { ...alert, currentPrice, distancePercent }
    }),
  )

  res.json(enriched)
}

export async function deleteAlert(req: Request, res: Response): Promise<void> {
  const user = await resolveUser(req.userId, res)
  if (!user) return

  const { id } = req.params
  const alert = await prisma.priceAlert.findFirst({ where: { id, userId: user.id } })
  if (!alert) { res.status(404).json({ error: 'Alert not found' }); return }

  await prisma.priceAlert.delete({ where: { id } })
  res.json({ success: true })
}

export async function markAlertTriggered(req: Request, res: Response): Promise<void> {
  const user = await resolveUser(req.userId, res)
  if (!user) return

  const { id } = req.params
  const alert = await prisma.priceAlert.findFirst({ where: { id, userId: user.id } })
  if (!alert) { res.status(404).json({ error: 'Alert not found' }); return }

  const updated = await prisma.priceAlert.update({
    where: { id },
    data: { isTriggered: true, triggeredAt: new Date() },
  })

  res.json(updated)
}
