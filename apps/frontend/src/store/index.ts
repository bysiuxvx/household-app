import { atom } from 'jotai'

export interface Household {
  id: string
  name: string
  members: any[]
}

export const selectedHouseholdAtom = atom<Household | null>(null)
