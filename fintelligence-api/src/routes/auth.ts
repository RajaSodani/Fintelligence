import { Router } from 'express'
import { handleSendOtp, handleVerifyOtp } from '../controllers/auth.controller'

const router = Router()

router.post('/send-otp', handleSendOtp)
router.post('/verify-otp', handleVerifyOtp)

export default router
