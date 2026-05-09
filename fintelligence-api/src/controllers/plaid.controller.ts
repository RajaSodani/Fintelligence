import type { Request, Response } from 'express'
import * as plaidService from '../services/plaid.service'

export async function createLinkToken(req: Request, res: Response): Promise<void> {
  const linkToken = await plaidService.createLinkToken(req.userId)
  res.json({ link_token: linkToken })
}

export async function exchangeToken(req: Request, res: Response): Promise<void> {
  const { publicToken } = req.body as { publicToken: string }
  if (!publicToken) { res.status(400).json({ error: 'publicToken is required' }); return }

  await plaidService.exchangePublicToken(publicToken, req.userId)
  res.json({ success: true })
}

export async function syncTransactions(req: Request, res: Response): Promise<void> {
  const count = await plaidService.syncTransactions(req.userId)
  res.json({ synced: count })
}

export async function getAccounts(req: Request, res: Response): Promise<void> {
  const accounts = await plaidService.getAccounts(req.userId)
  res.json(accounts)
}
