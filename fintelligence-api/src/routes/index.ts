import { Router } from 'express'
import authRouter from './auth'
import usersRouter from './users'
import transactionsRouter from './transactions'
import setuRouter from './setu'
import stripeRouter from './stripe'
import portfolioRouter from './portfolio'
import watchlistRouter from './watchlist'
import alertsRouter from './alerts'
import marketRouter from './market'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fintelligence-api', version: '1.0.0' })
})

router.use('/auth', authRouter)
router.use('/users', usersRouter)
router.use('/transactions', transactionsRouter)
router.use('/setu', setuRouter)
router.use('/stripe', stripeRouter)
router.use('/portfolio', portfolioRouter)
router.use('/watchlist', watchlistRouter)
router.use('/alerts', alertsRouter)
router.use('/market', marketRouter)

export default router
