import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { createAlert, getAlerts, deleteAlert, updateAlert, markAlertTriggered } from '../controllers/alerts.controller'

const router = Router()

router.get('/',               requireAuth, getAlerts)
router.post('/',              requireAuth, createAlert)
router.patch('/:id',          requireAuth, updateAlert)
router.delete('/:id',         requireAuth, deleteAlert)
router.patch('/:id/trigger',  requireAuth, markAlertTriggered)

export default router
