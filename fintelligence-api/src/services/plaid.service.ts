import { plaidClient, PLAID_PRODUCTS, PLAID_COUNTRY_CODES } from '../config/plaid'
import { PrismaClient } from '@prisma/client'
import { categorizeTransaction } from './transactions.service'
import { subDays, format } from 'date-fns'

const prisma = new PrismaClient()

export async function createLinkToken(userId: string): Promise<string> {
  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: 'Fintelligence',
    products: PLAID_PRODUCTS,
    country_codes: PLAID_COUNTRY_CODES,
    language: 'en',
  })
  return response.data.link_token
}

export async function exchangePublicToken(
  publicToken: string,
  userId: string,
): Promise<{ accessToken: string; itemId: string }> {
  const response = await plaidClient.itemPublicTokenExchange({ public_token: publicToken })
  const { access_token, item_id } = response.data

  await prisma.user.update({
    where: { clerkId: userId },
    data: { plaidAccessToken: access_token, plaidItemId: item_id },
  })

  return { accessToken: access_token, itemId: item_id }
}

export async function syncTransactions(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user?.plaidAccessToken) throw Object.assign(new Error('No Plaid access token'), { statusCode: 400 })

  const startDate = format(subDays(new Date(), 90), 'yyyy-MM-dd')
  const endDate = format(new Date(), 'yyyy-MM-dd')

  const response = await plaidClient.transactionsGet({
    access_token: user.plaidAccessToken,
    start_date: startDate,
    end_date: endDate,
  })

  const transactions = response.data.transactions
  let syncCount = 0

  for (const tx of transactions) {
    await prisma.transaction.upsert({
      where: { plaidTransactionId: tx.transaction_id },
      create: {
        userId: user.id,
        plaidTransactionId: tx.transaction_id,
        name: tx.name,
        amount: tx.amount,
        category: categorizeTransaction(tx.name),
        subCategory: tx.personal_finance_category?.detailed ?? null,
        date: new Date(tx.date),
        merchantName: tx.merchant_name ?? null,
        pending: tx.pending,
      },
      update: {
        pending: tx.pending,
        amount: tx.amount,
      },
    })
    syncCount++
  }

  // Sync accounts
  const accountsResponse = await plaidClient.accountsGet({ access_token: user.plaidAccessToken })
  for (const acc of accountsResponse.data.accounts) {
    await prisma.account.upsert({
      where: { plaidAccountId: acc.account_id },
      create: {
        userId: user.id,
        plaidAccountId: acc.account_id,
        name: acc.name,
        type: acc.type,
        subType: acc.subtype ?? null,
        balance: acc.balances.current ?? 0,
        currency: acc.balances.iso_currency_code ?? 'USD',
      },
      update: {
        balance: acc.balances.current ?? 0,
      },
    })
  }

  return syncCount
}

export async function getAccounts(userId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 })
  return prisma.account.findMany({ where: { userId: user.id } })
}
