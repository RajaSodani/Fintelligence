import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { getTransactions, getTransactionSummary, getCashflow } from '../controllers/transactions.controller'

const router = Router()

router.get('/', requireAuth, getTransactions)
router.get('/summary', requireAuth, getTransactionSummary)
router.get('/cashflow', requireAuth, getCashflow)

export default router
