import { addHours, isAfter } from 'date-fns'

import { UserRoles } from '@household/shared'

import prisma from './prisma-client'

const CODE_LENGTH = 6
const CODE_EXPIRY_HOURS = 1

/**
 * Generates a random numeric code of specified length
 */
function generateVerificationCode(length: number = CODE_LENGTH): string {
  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length) - 1
  return Math.floor(min + Math.random() * (max - min + 1)).toString()
}

/**
 * Creates a new verification code for the given household
 */
export async function createVerificationCode(householdId: string): Promise<string> {
  const code = generateVerificationCode()
  const expiresAt = addHours(new Date(), CODE_EXPIRY_HOURS)

  // Delete any existing codes for this household
  await prisma.verificationCode.deleteMany({
    where: { householdId },
  })

  await prisma.verificationCode.create({
    data: {
      code,
      householdId,
      expiresAt,
    },
  })

  return code
}

/**
 * Validates a verification code for the given household
 * @returns true if code is valid, not expired, and household secret matches
 */
export async function validateVerificationCode(
  householdId: string,
  code: string,
  secret: string
): Promise<boolean> {
  const now = new Date()

  // verify the household secret
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: { secret: true },
  })

  if (!household || household.secret !== secret) {
    return false
  }

  const verification = await prisma.verificationCode.findFirst({
    where: {
      householdId,
      code,
      used: false,
      expiresAt: {
        gt: now,
      },
    },
  })

  if (!verification) {
    return false
  }

  // mark the code as used
  await prisma.verificationCode.update({
    where: { id: verification.id },
    data: { used: true },
  })

  return true
}

/**
 * Verifies a verification code and joins the user to the household if valid
 * @param code The verification code
 * @param secret The household secret
 * @param userId The ID of the user joining the household
 * @returns The joined household or null if verification failed
 */
export async function verifyAndJoinHousehold(code: string, secret: string, userId: string) {
  // find verification code
  const verification = await prisma.verificationCode.findFirst({
    where: {
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
  })

  // check if code exists and isn't expired
  if (!verification || verification.used || isAfter(new Date(), verification.expiresAt)) {
    return null
  }

  // find the household
  const household = await prisma.household.findUnique({
    where: { id: verification.householdId },
  })

  if (!household || household.secret !== secret) {
    return null
  }

  // check if user is already a member of the household
  const existingMembership = await prisma.userOnHousehold.findFirst({
    where: {
      userId,
      householdId: verification.householdId,
    },
  })

  if (existingMembership) {
    return household
  }

  // mark the verification code as used
  await prisma.verificationCode.update({
    where: { id: verification.id },
    data: { used: true },
  })

  // add user to the household
  await prisma.userOnHousehold.create({
    data: {
      userId,
      householdId: verification.householdId,
      role: UserRoles.MEMBER,
      joinedAt: new Date(),
    },
  })

  return household
}

/**
 * Cleans up expired verification codes
 */
export async function cleanupExpiredVerificationCodes(): Promise<void> {
  await prisma.verificationCode.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { used: true }],
    },
  })
}
