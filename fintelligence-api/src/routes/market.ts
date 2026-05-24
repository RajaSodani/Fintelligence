import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { getTickerQuote, getTickerOHLC, getMarketStrip, getMovers, searchTickers } from '../controllers/market.controller'

const router = Router()

router.get('/strip',         requireAuth, getMarketStrip)
router.get('/movers',        requireAuth, getMovers)
router.get('/search',        requireAuth, searchTickers)
router.get('/:ticker/quote', requireAuth, getTickerQuote)
router.get('/:ticker/ohlc',  requireAuth, getTickerOHLC)

export default router
