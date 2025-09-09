import { User, clerkClient, getAuth } from '@clerk/express'
import express, { Router } from 'express'

import {
  HOUSEHOLD_MIN_NAME_LENGTH,
  HOUSEHOLD_MIN_SECRET_LENGTH,
  UserRoles,
} from '@household/shared'

import prisma from '../utils/prisma-client'

export const householdRouter: Router = express.Router()

// Update household secret
householdRouter.patch(
  '/:householdId/secret',
  async (req: express.Request, res: express.Response): Promise<void> => {
    const { userId } = getAuth(req)
    const { householdId } = req.params
    const { secret } = req.body

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    if (!secret || typeof secret !== 'string' || secret.length < HOUSEHOLD_MIN_SECRET_LENGTH) {
      res.status(400).json({
        error: `Secret must be at least ${HOUSEHOLD_MIN_SECRET_LENGTH} characters long`,
      })
      return
    }

    try {
      // chec if user is admin of the household
      const membership = await prisma.userOnHousehold.findFirst({
        where: {
          userId,
          householdId,
          role: UserRoles.ADMIN,
        },
      })

      if (!membership) {
        res.status(403).json({ error: 'Forbidden: Only household admins can update the secret' })
        return
      }

      const updatedHousehold = await prisma.household.update({
        where: { id: householdId },
        data: { secret },
        select: {
          id: true,
          name: true,
          description: true,
          secret: true,
          updatedAt: true,
        },
      })

      res.json(updatedHousehold)
    } catch (error) {
      console.error('Error updating household secret:', error)
      res.status(500).json({ error: 'Failed to update household secret' })
    }
  }
)

// Get single household by ID
householdRouter.get(
  '/:householdId',
  async (req: express.Request, res: express.Response): Promise<void> => {
    const { userId } = getAuth(req)
    const { householdId } = req.params

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    try {
      const household = await prisma.household.findFirst({
        where: {
          id: householdId,
          members: {
            some: {
              userId,
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  username: true,
                },
              },
            },
          },
          lists: {
            include: {
              items: {
                include: {
                  createdBy: {
                    select: {
                      id: true,
                      name: true,
                      username: true,
                    },
                  },
                  completedBy: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: 'desc',
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      })

      if (!household) {
        res.status(404).json({ error: 'Household not found or access denied' })
        return
      }

      res.json(household)
    } catch (error) {
      console.error('Error fetching household:', error)
      res.status(500).json({ error: 'Failed to fetch household' })
    }
  }
)

householdRouter.get('/', async (req: express.Request, res: express.Response): Promise<void> => {
  const { userId } = getAuth(req)

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const user: User = await clerkClient.users.getUser(userId)

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        name:
          user.firstName || user.lastName
            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
            : undefined,
        username: user.username,
      },
      select: { id: true },
    })

    const households = await prisma.household.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
          },
        },
        lists: {
          include: {
            items: {
              include: {
                createdBy: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                  },
                },
                completedBy: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    res.json(households)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch households' })
  }
})

// create household
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
      res
        .status(400)
        .json({ error: `Name must be at least ${HOUSEHOLD_MIN_NAME_LENGTH} characters long` })
    }

    const [userRecord, newHousehold] = await prisma.$transaction([
      prisma.user.upsert({
        where: { id: userId! },
        update: {},
        create: {
          id: user.id,
          email: user.primaryEmailAddress!.emailAddress,
          name:
            user.firstName || user.lastName
              ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
              : undefined,
          username: user.username,
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
          lists: {
            create: [
              {
                name: 'Tasks',
                type: 'TODO',
                createdById: user.id,
                items: {
                  create: [],
                },
              },
              {
                name: 'Groceries',
                type: 'SHOPPING',
                createdById: user.id,
                items: {
                  create: [],
                },
              },
            ],
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  username: true,
                },
              },
            },
          },
          lists: {
            include: {
              items: {
                include: {
                  createdBy: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  completedBy: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: 'asc',
                },
              },
              createdBy: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
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

// leave household = remove user from household
householdRouter.delete(
  '/:householdId/members/me',
  async (req: express.Request, res: express.Response): Promise<void> => {
    const { userId } = getAuth(req)
    const { householdId } = req.params

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    try {
      await prisma.$transaction(async (tx) => {
        // get the user's membership
        const currentMembership = await tx.userOnHousehold.findUnique({
          where: {
            userId_householdId: {
              userId,
              householdId,
            },
          },
          include: {
            household: {
              include: {
                _count: {
                  select: { members: true },
                },
              },
            },
          },
        })

        if (!currentMembership) {
          res.status(404).json({ error: 'Household or membership not found' })
          return
        }

        // if user is the only member, delete the household
        if (currentMembership.household._count.members === 1) {
          await tx.household.delete({
            where: { id: householdId },
          })
          res.status(200).json({ message: 'Household deleted successfully' })
          return
        }

        // if user is an admin, transfer admin role to another member
        if (currentMembership.role === UserRoles.ADMIN) {
          const newAdmin = await tx.userOnHousehold.findFirst({
            where: {
              householdId,
              userId: { not: userId },
            },
            orderBy: { joinedAt: 'asc' }, // oldest member (after admin)
          })

          if (newAdmin) {
            await tx.userOnHousehold.update({
              where: {
                userId_householdId: {
                  userId: newAdmin.userId,
                  householdId,
                },
              },
              data: { role: UserRoles.ADMIN },
            })
          }
        }

        // remove the user from the household
        await tx.userOnHousehold.delete({
          where: {
            userId_householdId: {
              userId,
              householdId,
            },
          },
        })

        res.status(200).json({ message: 'Left household successfully' })
      })
    } catch (error) {
      console.error('Error leaving household:', error)
      res.status(500).json({ error: 'Failed to leave household' })
    }
  }
)
