import express from 'express'

import { Household } from '@household/shared'

const app = express()
const port = 3000

app.use(express.json())

app.get('/', (req, res) => {
  const household: Household = {
    id: '1',
    name: 'My Household',
    members: ['User 1', 'User 2'],
  }

  res.json(household)
})

app.listen(port, () => {
  process.stdout.write(`Server is running at http://localhost:${port}\n`)
})
