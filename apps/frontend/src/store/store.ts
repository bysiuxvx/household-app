import { useUser } from '@clerk/clerk-react'
import { type Atom, atom, useAtom } from 'jotai'

import type { Household } from '../models/models.ts'

export interface UserRoleInfo {
  isAdmin: boolean
}

export const selectedHouseholdAtom: Atom<Household> = atom<Household | null>(null)

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
