import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { initiateConsent, getConsentStatus, syncData, getAccounts, webhook } from '../controllers/setu.controller'

const router = Router()

router.post('/consent/initiate', requireAuth, initiateConsent)
router.get('/consent/status', requireAuth, getConsentStatus)
router.post('/sync', requireAuth, syncData)
router.get('/accounts', requireAuth, getAccounts)
router.post('/webhook', webhook) // no auth — Setu calls this

export default router
