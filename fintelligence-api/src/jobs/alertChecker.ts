import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { getQuotes } from '../services/market.service'

const prisma = new PrismaClient()

async function checkAlerts() {
  const alerts = await prisma.priceAlert.findMany({ where: { isTriggered: false } })
  if (alerts.length === 0) return

  const tickers = [...new Set(alerts.map((a) => a.ticker))]
  const quotes  = await getQuotes(tickers)

  await Promise.allSettled(
    alerts.map(async (alert) => {
      const q = quotes.get(alert.ticker)
      if (!q) return

      const triggered =
        (alert.condition === 'ABOVE' && q.price >= alert.targetPrice) ||
        (alert.condition === 'BELOW' && q.price <= alert.targetPrice)

      if (triggered) {
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: { isTriggered: true, triggeredAt: new Date() },
        })
        console.log(`[AlertChecker] ${alert.ticker} alert triggered — ${alert.condition} ${alert.targetPrice} (current: ${q.price})`)
      }
    }),
  )
}

export function startAlertChecker() {
  // Run every 60 seconds
  cron.schedule('* * * * *', () => {
    checkAlerts().catch((err) => console.error('[AlertChecker] Error:', err))
  })
  console.log('🔔 Alert checker started (every 60s)')
}
