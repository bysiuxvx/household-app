import { useUser } from '@clerk/clerk-react'
import { atom, useAtom } from 'jotai'

import type { UserRole } from '../models/models.ts'

export interface Household {
  id: string
  name: string
  members: Array<{
    id: string
    role: UserRole
    [key: string]: any
  }>
}

export interface UserRoleInfo {
  isAdmin: boolean
}

export const selectedHouseholdAtom = atom<Household | null>(null)

export const useUserRole = (): UserRoleInfo => {
  const { user } = useUser()
  const [selectedHousehold] = useAtom(selectedHouseholdAtom)

  if (!selectedHousehold || !user) {
    return { isAdmin: false }
  }

  const member = selectedHousehold.members.find((member) => member.userId === user.id)
  return {
    isAdmin: member?.role === 'ADMIN',
  }
}
