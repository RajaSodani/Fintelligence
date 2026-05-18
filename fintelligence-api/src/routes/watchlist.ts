import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { addToWatchlist, getWatchlist, removeFromWatchlist } from '../controllers/watchlist.controller'

const router = Router()

router.get('/',       requireAuth, getWatchlist)
router.post('/',      requireAuth, addToWatchlist)
router.delete('/:id', requireAuth, removeFromWatchlist)

export default router
