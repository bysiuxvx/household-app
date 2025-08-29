import { clerkMiddleware } from '@clerk/express'
import cors from 'cors'
import express, { Express, Request, Response, NextFunction } from 'express'

import { householdRouter } from './routes/householdRoutes'
import { listItemRouter } from './routes/listItemRoutes'
import { verificationRouter } from './routes/verificationRoute'

const app: Express = express()

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

app.use(express.json())

// Test routes - should work without authentication
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/routes', (req: Request, res: Response) => {
  const routes = app._router.stack
    .filter((r: any) => r.route)
    .map((r: any) => ({
      method: Object.keys(r.route.methods)[0].toUpperCase(),
      path: r.route.path
    }))
  res.json(routes)
})

// Apply Clerk middleware
app.use('/api', clerkMiddleware())

// API routes
app.use('/api/households', householdRouter)
app.use('/api', listItemRouter)
app.use('/api/verification', verificationRouter)

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Hello World!',
    api: {
      health: '/api/health',
      routes: '/api/routes',
      households: '/api/households',
      verification: '/api/verification'
    }
  })
})

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  })
})

export default app
