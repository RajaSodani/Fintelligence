import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { createAlert, getAlerts, deleteAlert, markAlertTriggered } from '../controllers/alerts.controller'

const router = Router()

router.get('/',            requireAuth, getAlerts)
router.post('/',           requireAuth, createAlert)
router.delete('/:id',      requireAuth, deleteAlert)
router.patch('/:id/trigger', requireAuth, markAlertTriggered)

export default router
