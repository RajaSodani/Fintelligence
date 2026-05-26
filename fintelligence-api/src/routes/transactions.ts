import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  getTransactions,
  getTransactionSummary,
  getCashflow,
  getNetWorth,
  updateTransactionCategory,
  createManualTransaction,
  createManualAccount,
} from '../controllers/transactions.controller'

const router = Router()

router.get('/', requireAuth, getTransactions)
router.get('/summary', requireAuth, getTransactionSummary)
router.get('/cashflow', requireAuth, getCashflow)
router.get('/net-worth', requireAuth, getNetWorth)
router.post('/manual', requireAuth, createManualTransaction)
router.post('/manual-account', requireAuth, createManualAccount)
router.patch('/:id/category', requireAuth, updateTransactionCategory)

export default router
