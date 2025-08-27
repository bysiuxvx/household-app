import { atom } from 'jotai';

export interface Household {
  id: string;
  name: string;
}

export const selectedHouseholdAtom = atom<Household | null>(null);
