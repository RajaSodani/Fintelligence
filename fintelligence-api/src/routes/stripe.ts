import { Router } from 'express'
import express from 'express'
import { requireAuth } from '../middleware/auth'
import { createCheckoutSession, handleWebhook, getSubscription } from '../controllers/stripe.controller'

const router = Router()

router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook)
router.post('/create-checkout-session', requireAuth, createCheckoutSession)
router.get('/subscription', requireAuth, getSubscription)

export default router
