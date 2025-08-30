import { clerkMiddleware } from '@clerk/express'
import cors from 'cors'
import express, { Express } from 'express'

import { householdRouter } from './routes/householdRoutes'
import { listItemRouter } from './routes/listItemRoutes'
import { verificationRouter } from './routes/verificationRoute'

const app: Express = express()

// middlewares
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())

// routes
app.get('/api/health', (_, res) => res.json({ status: 'ok' }))
app.use('/api', clerkMiddleware())
app.use('/api/households', householdRouter)
app.use('/api', listItemRouter)
app.use('/api/verification', verificationRouter)

export default app
