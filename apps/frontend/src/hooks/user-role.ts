import { useUser } from '@clerk/clerk-react'
import { useAtom } from 'jotai'

import { selectedHouseholdAtom } from '../store/store.ts'

export interface UserRoleInfo {
  isAdmin: boolean
}

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
