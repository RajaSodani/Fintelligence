import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { getTransactions, getTransactionSummary, getCashflow, getNetWorth } from '../controllers/transactions.controller'

const router = Router()

router.get('/', requireAuth, getTransactions)
router.get('/summary', requireAuth, getTransactionSummary)
router.get('/cashflow', requireAuth, getCashflow)
router.get('/net-worth', requireAuth, getNetWorth)

export default router
