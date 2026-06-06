import type { Request, Response } from 'express'
import { z } from 'zod'
import { sendOtp, verifyOtp } from '../services/auth.service'

const sendOtpSchema = z.object({
  email: z.string().email(),
})

const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

export async function handleSendOtp(req: Request, res: Response): Promise<void> {
  const parsed = sendOtpSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Valid email is required' })
    return
  }

  await sendOtp(parsed.data.email.toLowerCase())
  res.json({ ok: true })
}

export async function handleVerifyOtp(req: Request, res: Response): Promise<void> {
  const parsed = verifyOtpSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request' })
    return
  }

  const { email, code, firstName, lastName } = parsed.data

  try {
    const token = await verifyOtp(email.toLowerCase(), code, { firstName, lastName })
    res.json({ token })
  } catch {
    res.status(401).json({ error: 'Invalid or expired code' })
  }
}
