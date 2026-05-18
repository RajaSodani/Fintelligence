import axios from 'axios'
import { PrismaClient } from '@prisma/client'
import { subYears, addMonths, format } from 'date-fns'
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
  // to = now + 12 months (matches consentDuration) so any future session's `to = now` always falls within this range
  const to = format(addMonths(new Date(), 12), "yyyy-MM-dd'T'HH:mm:ss'Z'")

  const { data } = await http.post('/consents', {
    vua: `${mobileNumber}@onemoney`,
    consentDuration: { unit: 'MONTH', value: 12 },
    dataRange: { from, to },
    dataLife: { unit: 'MONTH', value: 0 },
    consentTypes: ['PROFILE', 'SUMMARY', 'TRANSACTIONS'],
    fiTypes: ['DEPOSIT', 'TERM_DEPOSIT', 'RECURRING_DEPOSIT', 'IDR'],
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
  const consent = await getConsentStatus(consentId)
  const consentStart = new Date(consent.detail?.consentStart ?? consent.Detail?.consentStart)
  const from = format(subYears(consentStart, 2), "yyyy-MM-dd'T'HH:mm:ss'Z'")
  const to = format(consentStart, "yyyy-MM-dd'T'HH:mm:ss'Z'")

  const sessionBody = { consentId, format: 'json', dataRange: { from, to } }
  console.log('[Setu] createDataSession body:', JSON.stringify(sessionBody))

  let data: any
  try {
    const res = await http.post('/sessions', sessionBody)
    data = res.data
  } catch (err: any) {
    console.error('[Setu] createDataSession error:', JSON.stringify(err?.response?.data))
    throw err
  }

  return data
}

export async function fetchAndStoreSessionData(sessionId: string, userId: string) {
  const { data: session } = await http.get(`/sessions/${sessionId}`)

  if (session.status !== 'COMPLETED' && session.status !== 'PARTIAL') return

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return

  // Setu sandbox returns `fips`; some older shapes use `Payload`
  const fipList = session.fips ?? session.Payload ?? []

  for (const fip of fipList) {
    const accList = fip.accounts ?? fip.data ?? []
    for (const acc of accList) {
      const fi = acc.decryptedFI ?? acc.data
      if (!fi) continue

      // Setu sandbox uses lowercase keys: `account`, `summary`, `transactions`
      const acct = fi.account ?? fi.Account ?? fi
      const summary = acct.summary ?? acct.Summary
      const txList = acct.transactions?.transaction ?? acct.Transactions?.Transaction ?? []
      const balance = parseFloat(summary?.currentBalance ?? '0')
      const currency = summary?.currency ?? 'INR'
      const accType = acct.type ?? acct['@type'] ?? fip.fipID

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
      for (const tx of txList) {
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

  // Poll session until COMPLETED/PARTIAL — webhooks don't reach localhost in dev
  const MAX_ATTEMPTS = 15
  const INTERVAL_MS = 2000
  let attempts = 0
  let sessionStatus = session.status

  while (sessionStatus !== 'COMPLETED' && sessionStatus !== 'PARTIAL' && sessionStatus !== 'FAILED' && sessionStatus !== 'EXPIRED' && attempts < MAX_ATTEMPTS) {
    await new Promise((r) => setTimeout(r, INTERVAL_MS))
    const { data: live } = await http.get(`/sessions/${session.id}`)
    sessionStatus = live.status ?? sessionStatus
    attempts++
  }

  if (sessionStatus === 'COMPLETED' || sessionStatus === 'PARTIAL') {
    await fetchAndStoreSessionData(session.id, user.id)
  }

  return { sessionId: session.id }
}

export async function getAccounts(userId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 })
  return prisma.account.findMany({ where: { userId: user.id } })
}
