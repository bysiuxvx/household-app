import { User, clerkClient, getAuth } from '@clerk/express'
import { HOUSEHOLD_MIN_NAME_LENGTH, UserRoles } from '@household/shared';
import express, { Router } from 'express';

import prisma from '../utils/prisma-client';

export const householdRouter: Router = express.Router()

householdRouter.get('/', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const households = await prisma.household.findMany({
      include: {
        members: true,
      },
    })
    res.json(households)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch households' })
  }
})

householdRouter.post('/', async (req: express.Request, res: express.Response): Promise<void> => {
  const { userId } = getAuth(req)
  const user: User = await clerkClient.users.getUser(userId!)
  try {
    const { name } = req.body

    if (!name) {
      res.status(400).json({ error: 'Name is required' })
      return
    }

    if (name.trim().length < HOUSEHOLD_MIN_NAME_LENGTH) {
      res.status(400).json({ error: `Name must be at least ${HOUSEHOLD_MIN_NAME_LENGTH} characters long` })
    }

    const [userRecord, newHousehold] = await prisma.$transaction([
      prisma.user.upsert({
        where: { id: userId! },
        update: {},
        create: {
          id: user.id,
          email: user.primaryEmailAddress!.emailAddress,
          name: user.firstName,
        },
      }),
      prisma.household.create({
        data: {
          name,
          members: {
            create: {
              userId: user.id,
              role: UserRoles.ADMIN,
            },
          },
        },
        include: {
          members: true,
        },
      }),
    ])

    res.status(201).json(newHousehold)
  } catch (error) {
    console.error('Failed to create household:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    res.status(500).json({
      error: 'Failed to create household',
      ...(process.env.NODE_ENV === 'development' && { details: errorMessage }),
    })
  }
})
