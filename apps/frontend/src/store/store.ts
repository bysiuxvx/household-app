import { type Atom, atom } from 'jotai'

import type { Household } from '../models/models.ts'

export const selectedHouseholdAtom: Atom<Household> = atom<Household | null>(null)
