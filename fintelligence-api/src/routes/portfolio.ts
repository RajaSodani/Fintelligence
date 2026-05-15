import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { addHolding, getHoldings, deleteHolding } from '../controllers/portfolio.controller'

const router = Router()

router.get('/',      requireAuth, getHoldings)
router.post('/',     requireAuth, addHolding)
router.delete('/:id', requireAuth, deleteHolding)

export default router
