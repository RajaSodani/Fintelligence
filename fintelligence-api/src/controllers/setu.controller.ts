import type { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import * as setuService from '../services/setu.service'

const prisma = new PrismaClient()

export async function initiateConsent(req: Request, res: Response): Promise<void> {
  const { mobileNumber } = req.body as { mobileNumber: string }
  if (!mobileNumber) { res.status(400).json({ error: 'mobileNumber is required' }); return }

  const redirectUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/settings?consent=done`
  const consent = await setuService.createConsent(req.userId, mobileNumber, redirectUrl)
  res.json(consent)
}

export async function getConsentStatus(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { clerkId: req.userId } })
  if (!user) { res.status(404).json({ error: 'User not found' }); return }
  let status = user.setuConsentStatus ?? 'NONE'

  // If still pending, poll Setu live — webhooks don't reach localhost in dev
  if (user.setuConsentId && status === 'PENDING') {
    try {
      const live = await setuService.getConsentStatus(user.setuConsentId)
      const liveStatus: string = live.status ?? status

      if (liveStatus !== status) {
        await prisma.user.update({
          where: { id: user.id },
          data: { setuConsentStatus: liveStatus },
        })
        status = liveStatus

        // If just turned ACTIVE, persist linked accounts from the consent detail
        if (liveStatus === 'ACTIVE' && live.detail?.accounts?.length) {
          await setuService.handleConsentWebhook({
            type: 'CONSENT_STATUS_UPDATE',
            consentId: user.setuConsentId,
            data: { status: liveStatus, detail: live.detail },
            timestamp: new Date().toISOString(),
          }).catch(console.error)
        }
      }
    } catch (e) {
      console.error('[setu] live status check failed:', e)
    }
  }

  res.json({
    consentId: user.setuConsentId ?? null,
    status,
    consentUrl: user.setuConsentUrl ?? null,
  })
}

export async function expireConsent(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { clerkId: req.userId } })
  if (!user) { res.status(404).json({ error: 'User not found' }); return }

  if (user.setuConsentStatus === 'PENDING') {
    await prisma.user.update({
      where: { id: user.id },
      data: { setuConsentStatus: 'EXPIRED' },
    })
  }

  res.json({ success: true })
}

export async function syncData(req: Request, res: Response): Promise<void> {
  const result = await setuService.syncUserData(req.userId)
  res.json(result)
}

export async function getAccounts(req: Request, res: Response): Promise<void> {
  const accounts = await setuService.getAccounts(req.userId)
  res.json(accounts)
}

// Webhook — no auth, called by Setu
export async function webhook(req: Request, res: Response): Promise<void> {
  const payload = req.body
  res.status(200).json({ success: true }) // ACK immediately

  if (payload?.type === 'CONSENT_STATUS_UPDATE') {
    await setuService.handleConsentWebhook(payload).catch(console.error)
  } else if (payload?.type === 'SESSION_STATUS_UPDATE') {
    await setuService.handleSessionWebhook(payload).catch(console.error)
  }
}
