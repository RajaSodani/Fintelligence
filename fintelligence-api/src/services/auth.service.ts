import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { PrismaClient } from '@prisma/client'
import { signToken } from '../config/jwt'

const prisma = new PrismaClient()

const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes

function makeTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function sendOtp(email: string): Promise<void> {
  const code = crypto.randomInt(100000, 999999).toString()
  const expiresAt = new Date(Date.now() + OTP_TTL_MS)

  // Invalidate old codes for this email
  await prisma.otpCode.updateMany({
    where: { email, used: false },
    data: { used: true },
  })

  await prisma.otpCode.create({ data: { email, code, expiresAt } })

  const from = process.env.SMTP_FROM ?? `Fintelligence <noreply@fintelligence.ai>`

  const transport = makeTransport()
  await transport.sendMail({
    from,
    to: email,
    subject: `Your Fintelligence sign-in code: ${code}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0e1018;color:#f0f2f8;border-radius:12px">
        <h2 style="margin:0 0 8px;font-size:22px;color:#f0f2f8">Your sign-in code</h2>
        <p style="color:#8b90a0;margin:0 0 24px">Use this code to sign in to Fintelligence. It expires in 10 minutes.</p>
        <div style="background:#13161f;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:24px;text-align:center;letter-spacing:12px;font-size:32px;font-weight:700;color:#00e87a;font-family:monospace">
          ${code}
        </div>
        <p style="color:#8b90a0;margin:24px 0 0;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  })
}

export async function verifyOtp(
  email: string,
  code: string,
  opts?: { firstName?: string; lastName?: string },
): Promise<string> {
  const record = await prisma.otpCode.findFirst({
    where: { email, code, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })

  if (!record) throw new Error('Invalid or expired code')

  await prisma.otpCode.update({ where: { id: record.id }, data: { used: true } })

  let user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        firstName: opts?.firstName ?? null,
        lastName: opts?.lastName ?? null,
        name: [opts?.firstName, opts?.lastName].filter(Boolean).join(' ') || null,
      },
    })
  } else if (opts?.firstName || opts?.lastName) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: opts.firstName ?? user.firstName,
        lastName: opts.lastName ?? user.lastName,
        name: [opts.firstName ?? user.firstName, opts.lastName ?? user.lastName].filter(Boolean).join(' ') || user.name,
      },
    })
  }

  return signToken({
    userId: user.id,
    email: user.email,
    firstName: user.firstName ?? undefined,
    lastName: user.lastName ?? undefined,
  })
}
