import axios from 'axios'
import { PrismaClient } from '@prisma/client'
import { subYears, format } from 'date-fns'
import { SETU_BASE_URL, setuHeaders } from '../config/setu'
import { categorizeTransaction } from './transactions.service'

const prisma = new PrismaClient()
const http = axios.create({ baseURL: SETU_BASE_URL, headers: setuHeaders })

// ─── Consent ──────────────────────────────────────────────────────────────────

export async function createConsent(
  userId: string,
  mobileNumber: string,
  redirectUrl: string,
): Promise<{ id: string; url: string; status: string }> {
  const from = format(subYears(new Date(), 2), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  const to = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'")

  const { data } = await http.post('/consents', {
    vua: `${mobileNumber}@setu`,
    consentDuration: { unit: 'MONTH', value: '12' },
    dataRange: { from, to },
    context: [],
    redirectUrl,
  })

  await prisma.user.update({
    where: { clerkId: userId },
    data: {
      setuConsentId: data.id,
      setuConsentStatus: 'PENDING',
      setuConsentUrl: data.url,
    },
  })

  return data
}

export async function getConsentStatus(consentId: string) {
  const { data } = await http.get(`/consents/${consentId}`)
  return data
}

// ─── Webhook handler ──────────────────────────────────────────────────────────

export async function handleConsentWebhook(payload: {
  type: string
  consentId: string
  data: {
    status: string
    detail?: {
      accounts?: Array<{
        maskedAccNumber: string
        accType: string
        fipId: string
        fiType: string
        linkRefNumber: string
      }>
    }
  }
  timestamp: string
}) {
  const { type, consentId, data } = payload

  if (type !== 'CONSENT_STATUS_UPDATE') return

  const user = await prisma.user.findFirst({ where: { setuConsentId: consentId } })
  if (!user) return

  await prisma.user.update({
    where: { id: user.id },
    data: { setuConsentStatus: data.status },
  })

  // When consent turns ACTIVE, store linked account stubs from the webhook
  if (data.status === 'ACTIVE' && data.detail?.accounts?.length) {
    for (const acc of data.detail.accounts) {
      const existing = await prisma.account.findUnique({
        where: { setuLinkRefNumber: acc.linkRefNumber },
      })
      if (!existing) {
        await prisma.account.create({
          data: {
            userId: user.id,
            setuLinkRefNumber: acc.linkRefNumber,
            fipId: acc.fipId,
            maskedAccNumber: acc.maskedAccNumber,
            name: `${acc.fipId} ${acc.accType}`,
            type: acc.fiType.toLowerCase(),
            subType: acc.accType,
            balance: 0,
            currency: 'INR',
          },
        })
      }
    }
  }
}

export async function handleSessionWebhook(payload: {
  type: string
  dataSessionId: string
  consentId: string
  data: { status: string }
}) {
  if (payload.type !== 'SESSION_STATUS_UPDATE') return
  if (payload.data.status !== 'COMPLETED') return

  // Fetch data now that it's ready
  const user = await prisma.user.findFirst({ where: { setuConsentId: payload.consentId } })
  if (!user) return

  await fetchAndStoreSessionData(payload.dataSessionId, user.id)
}

// ─── Data session ─────────────────────────────────────────────────────────────

export async function createDataSession(
  consentId: string,
): Promise<{ id: string; status: string }> {
  const from = format(subYears(new Date(), 2), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  const to = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'")

  const { data } = await http.post('/sessions', {
    consentId,
    format: 'json',
    DataRange: { from, to },
  })

  return data
}

export async function fetchAndStoreSessionData(sessionId: string, userId: string) {
  const { data: session } = await http.get(`/sessions/${sessionId}`)

  if (session.status !== 'COMPLETED' && session.status !== 'PARTIAL') return

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return

  for (const fip of session.fips ?? []) {
    for (const acc of fip.accounts ?? []) {
      if (!acc.data) continue

      const summary = acc.data?.Summary ?? acc.data?.Account?.Summary
      const transactions = acc.data?.Transactions?.Transaction ?? acc.data?.Account?.Transactions?.Transaction ?? []
      const balance = parseFloat(summary?.currentBalance ?? '0')
      const currency = summary?.currency ?? 'INR'
      const accType = acc.data?.type ?? fip.fipID

      // Upsert account
      const account = await prisma.account.upsert({
        where: { setuLinkRefNumber: acc.linkRefNumber },
        create: {
          userId,
          setuLinkRefNumber: acc.linkRefNumber,
          fipId: fip.fipID,
          maskedAccNumber: acc.maskedAccNumber,
          name: `${fip.fipID} ${acc.maskedAccNumber ?? ''}`.trim(),
          type: accType,
          subType: summary?.type ?? null,
          balance,
          currency,
        },
        update: { balance, currency },
      })

      // Upsert transactions
      for (const tx of transactions) {
        const txDate = tx.transactionTimestamp ?? tx.valueDate
        const isCredit = tx.type === 'CREDIT'
        const amount = parseFloat(tx.amount ?? '0')
        const narration = tx.narration ?? tx.reference ?? 'Transaction'
        const externalId = tx.txnId ?? `${acc.linkRefNumber}-${txDate}-${amount}`

        await prisma.transaction.upsert({
          where: { externalTxnId: externalId },
          create: {
            userId,
            externalTxnId: externalId,
            name: narration,
            // Credits (money in) stored negative to match Plaid convention
            amount: isCredit ? -amount : amount,
            category: categorizeTransaction(narration),
            date: new Date(txDate),
            pending: false,
          },
          update: { amount: isCredit ? -amount : amount },
        })
      }

      // Snapshot balance
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const existing = await prisma.balanceSnapshot.findFirst({
        where: { accountId: account.id, takenAt: { gte: today } },
      })
      if (!existing) {
        const allAccounts = await prisma.account.findMany({ where: { userId } })
        const netWorth = allAccounts.reduce((s, a) => s + a.balance, 0)
        await prisma.balanceSnapshot.create({
          data: { accountId: account.id, balance, netWorth },
        })
      }
    }
  }
}

// ─── High-level sync ──────────────────────────────────────────────────────────

export async function syncUserData(userId: string): Promise<{ sessionId: string }> {
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user?.setuConsentId) throw Object.assign(new Error('No active consent'), { statusCode: 400 })
  if (user.setuConsentStatus !== 'ACTIVE') throw Object.assign(new Error('Consent not yet approved'), { statusCode: 400 })

  const session = await createDataSession(user.setuConsentId)
  // If session is immediately COMPLETED (sandbox), fetch right away
  if (session.status === 'COMPLETED') {
    await fetchAndStoreSessionData(session.id, user.id)
  }
  return { sessionId: session.id }
}

export async function getAccounts(userId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 })
  return prisma.account.findMany({ where: { userId: user.id } })
}
