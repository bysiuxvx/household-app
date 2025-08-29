import { getAuth } from '@clerk/express'
import express, { Router } from 'express'
import { z } from 'zod'

import prisma from '../utils/prisma-client'

const listItemRouter: Router = express.Router()

const createListItemSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().datetime().optional(),
})

const updateListItemSchema = z.object({
  text: z.string().min(1, 'Text is required').optional(),
  description: z.string().optional().nullable(),
  completed: z.boolean().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
})

listItemRouter.get('/lists/:listId/items', async (req, res) => {
  const { userId } = getAuth(req)
  const { listId } = req.params

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const list = await prisma.list.findFirst({
      where: {
        id: listId,
        household: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        items: {
          orderBy: {
            createdAt: 'desc',
          },
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
        },
      },
    })

    if (!list) {
      return res.status(404).json({ error: 'List not found or access denied' })
    }

    res.json(list.items)
  } catch (error) {
    console.error('Error fetching list items:', error)
    res.status(500).json({ error: 'Failed to fetch list items' })
  }
})

listItemRouter.post('/lists/:listId/items', async (req, res) => {
  const { userId } = getAuth(req)

  const { listId } = req.params

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const validation = createListItemSchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.format() })
  }

  try {
    const list = await prisma.list.findFirst({
      where: {
        id: listId,
        household: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    })

    if (!list) {
      return res.status(404).json({ error: 'List not found or access denied' })
    }

    const { text, description, priority, dueDate } = validation.data

    const listItem = await prisma.listItem.create({
      data: {
        text,
        description: description || null,
        priority: priority || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        list: {
          connect: { id: listId },
        },
        createdBy: {
          connect: { id: userId },
        },
      },
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
    })

    res.status(201).json(listItem)
  } catch (error) {
    console.error('Error creating list item:', error)
    res.status(500).json({ error: 'Failed to create list item' })
  }
})

// toggle item completion
listItemRouter.patch('/list-items/:itemId', async (req, res) => {
  const { userId } = getAuth(req)
  const { itemId } = req.params
  const { completed } = req.body

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // verify the user has access to it
    const item = await prisma.listItem.findUnique({
      where: { id: itemId },
      include: {
        list: {
          include: {
            household: {
              include: {
                members: {
                  where: { userId },
                },
              },
            },
          },
        },
      },
    })

    if (!item || item.list.household.members.length === 0) {
      return res.status(404).json({ error: 'Item not found or access denied' })
    }

    const isCompleted = completed === true

    const updatedItem = await prisma.listItem.update({
      where: { id: itemId },
      data: {
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
        completedById: isCompleted ? userId : null,
      },
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
    })

    res.json(updatedItem)
  } catch (error) {
    console.error('Error toggling item:', error)
    res.status(500).json({ error: 'Failed to update item' })
  }
})

listItemRouter.put('/lists/items/:itemId', async (req, res) => {
  const { userId } = getAuth(req)

  const { itemId } = req.params

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const validation = updateListItemSchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({ error: validation.error })
  }

  try {
    const existingItem = await prisma.listItem.findFirst({
      where: {
        id: itemId,
        list: {
          household: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
      },
      include: {
        list: true,
      },
    })

    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found or access denied' })
    }

    const { text, description, completed, priority, dueDate } = validation.data
    const updateData: any = {}

    if (text !== undefined) updateData.text = text
    if (description !== undefined) updateData.description = description
    if (priority !== undefined) updateData.priority = priority
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null

    if (completed !== undefined) {
      updateData.completed = completed
      updateData.completedAt = completed ? new Date() : null
      updateData.completedById = completed ? userId : null
    }

    const updatedItem = await prisma.listItem.update({
      where: { id: itemId },
      data: updateData,
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
    })

    res.json(updatedItem)
  } catch (error) {
    console.error('Error updating list item:', error)
    res.status(500).json({ error: 'Failed to update list item' })
  }
})

listItemRouter.delete('/lists/items/:itemId', async (req, res) => {
  const { userId } = getAuth(req)
  const { itemId } = req.params

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const existingItem = await prisma.listItem.findFirst({
      where: {
        id: itemId,
        list: {
          household: {
            members: {
              some: {
                userId,
              },
            },
          },
        },
      },
    })

    if (!existingItem) {
      return res.status(404).json({ error: 'Item not found or access denied' })
    }

    await prisma.listItem.delete({
      where: { id: itemId },
    })

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting list item:', error)
    res.status(500).json({ error: 'Failed to delete list item' })
  }
})

export { listItemRouter }
