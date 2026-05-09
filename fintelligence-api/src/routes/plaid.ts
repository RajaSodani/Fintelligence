import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { createLinkToken, exchangeToken, syncTransactions, getAccounts } from '../controllers/plaid.controller'

const router = Router()

router.post('/link/token/create', requireAuth, createLinkToken)
router.post('/exchange-token', requireAuth, exchangeToken)
router.post('/sync', requireAuth, syncTransactions)
router.get('/accounts', requireAuth, getAccounts)

export default router
