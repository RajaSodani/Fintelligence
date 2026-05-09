import { Router } from 'express'
import usersRouter from './users'
import transactionsRouter from './transactions'
import setuRouter from './setu'
import stripeRouter from './stripe'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fintelligence-api', version: '1.0.0' })
})

router.use('/users', usersRouter)
router.use('/transactions', transactionsRouter)
router.use('/setu', setuRouter)
router.use('/stripe', stripeRouter)

export default router
