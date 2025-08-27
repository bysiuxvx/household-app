import { clerkMiddleware } from '@clerk/express'
import cors from 'cors'
import express, { Express } from 'express'

import { householdRouter } from './routes/householdRoutes'

const app: Express = express()

app.use(cors());

app.use(express.json())

app.use('/api', clerkMiddleware())
app.use('/api/households', householdRouter)

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' })
})

export default app
