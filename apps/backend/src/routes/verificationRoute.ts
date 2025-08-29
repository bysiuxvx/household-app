import { getAuth } from '@clerk/express'
import express, { Router } from 'express'

import prisma from '../utils/prisma-client'
import { createVerificationCode, verifyAndJoinHousehold } from '../utils/verification'

export const verificationRouter: Router = express.Router()

// generate verification code
verificationRouter.post('/generate', async (req, res) => {
  const { userId } = getAuth(req)
  const { householdId } = req.body

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const membership = await prisma.userOnHousehold.findUnique({
    where: {
      userId_householdId: {
        userId,
        householdId,
      },
      role: 'ADMIN',
    },
  })

  if (!membership) {
    return res.status(403).json({
      error: 'Forbidden: You must be an admin of this household',
    })
  }

  try {
    const code = await createVerificationCode(householdId)
    res.json({ code })
  } catch (error) {
    console.error('Error generating verification code:', error)
    res.status(500).json({ error: 'Failed to generate verification code' })
  }
})

// validate verification code and join household
verificationRouter.post('/validate', async (req, res) => {
  const { userId } = getAuth(req)
  const { code, secret } = req.body

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const result = await verifyAndJoinHousehold(code, secret, userId)
    res.json({
      success: true,
    })
  } catch (error) {
    if (error.message === 'Invalid or expired verification code') {
      return res.status(400).json({ error: error.message })
    }
    if (error.message === 'User is already a member of this household') {
      return res.status(409).json({ error: error.message })
    }
    console.error('Verification error:', error)
    res.status(500).json({ error: 'Failed to verify and join household' })
  }
})
