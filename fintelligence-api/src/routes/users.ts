import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { getMe, updateMe } from '../controllers/users.controller'

const router = Router()

router.get('/me', requireAuth, getMe)
router.patch('/me', requireAuth, updateMe)

export default router
