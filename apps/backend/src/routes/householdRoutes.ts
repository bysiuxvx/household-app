import { UserRoles } from '@household/shared'
import express, { Router } from 'express'

import prisma from '../utils/prisma-client'


export const householdRouter: Router = express.Router()

householdRouter.get('/', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const households = await prisma.household.findMany({
      include: {
        members: true
      }
    })
    console.log(households)
    res.json(households)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to fetch households' })
  }
})

householdRouter.post('/', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    console.log('Request body:', req.body);
    
    const { name, description } = req.body;
    
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    // In a real app, you'd get this from your auth middleware
    const creatorId = String(Math.floor(Math.random() * 1000));
    const creatorEmail = `user${creatorId}@example.com`;
    const creatorName = `User ${creatorId}`;

    // Start a transaction to ensure both user and household are created together
    const [newHousehold] = await prisma.$transaction([
      // Create or find the user
      prisma.user.upsert({
        where: { id: creatorId },
        update: {},
        create: {
          id: creatorId,
          email: creatorEmail,
          name: creatorName
        }
      }),
      // Create the household with the user as admin
      prisma.household.create({
        data: {
          name,
          description,
          members: {
            create: {
              userId: creatorId,
              role: UserRoles.ADMIN
            }
          }
        },
        include: {
          members: true
        }
      })
    ]);

    res.status(201).json(newHousehold);
  } catch (error) {
    console.error('Failed to create household:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      error: 'Failed to create household',
      ...(process.env.NODE_ENV === 'development' && { details: errorMessage })
    });
  }
})
