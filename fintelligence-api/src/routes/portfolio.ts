import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { addHolding, getHoldings, deleteHolding, importHoldings } from '../controllers/portfolio.controller'

const router = Router()

router.get('/',         requireAuth, getHoldings)
router.post('/',        requireAuth, addHolding)
router.post('/import',  requireAuth, importHoldings)
router.delete('/:id',   requireAuth, deleteHolding)

export default router
