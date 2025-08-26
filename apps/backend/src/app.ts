import { Household } from '@household/shared'
import express, { Express } from 'express'

import { householdRouter } from './routes/householdRoutes'


const app: Express = express()

app.use(express.json())

// Use the household routes
app.use('/api/households', householdRouter)

app.get('/', (req, res) => {
  const household: Household = {
    id: '1',
    name: 'My Household',
    members: ['User 1', 'User 2'],
  }

  res.json(household)
})

app.use('/household', householdRouter)

export default app
