import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import apiRouter from './routes'
import { errorHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173', credentials: true }))
app.use(morgan('dev'))

// Stripe webhook needs raw body — mount stripe router BEFORE json middleware via the route itself
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/v1', apiRouter)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Core API running on port ${PORT}`)
})

export default app
