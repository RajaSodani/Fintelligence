import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { initiateConsent, getConsentStatus, expireConsent, syncData, getAccounts, deleteAccount, webhook } from '../controllers/setu.controller'

const router = Router()

router.post('/consent/initiate', requireAuth, initiateConsent)
router.get('/consent/status', requireAuth, getConsentStatus)
router.post('/consent/expire', requireAuth, expireConsent)
router.post('/sync', requireAuth, syncData)
router.get('/accounts', requireAuth, getAccounts)
router.delete('/accounts/:id', requireAuth, deleteAccount)
router.post('/webhook', webhook) // no auth — Setu calls this

export default router
