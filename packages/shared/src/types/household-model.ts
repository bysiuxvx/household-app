export const UserRoles = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles]

export const ListTypes = {
  TODO: 'TODO',
  GROCERY: 'GROCERY',
  SHOPPING: 'SHOPPING',
  OTHER: 'OTHER',
} as const

export type ListType = (typeof ListTypes)[keyof typeof ListTypes]

export interface User {
  id: string
  name: string
  email: string
  role?: UserRole
}

export interface Household {
  id: string
  name: string
  description?: string
  members: string[]
}
