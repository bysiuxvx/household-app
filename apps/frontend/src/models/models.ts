export type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

export type ListType = 'TODO' | 'GROCERY'

export type UserRole = 'ADMIN' | 'MEMBER'

export interface BaseUser {
  id: string
  email: string
  name: string | null
  username: string | null
}

// User with relations
export interface User extends BaseUser {
  createdAt: string
  updatedAt: string
  households: UserOnHousehold[]
  createdItems: ListItem[]
  completedItems: ListItem[]
  createdLists: List[]
}

// User with minimal fields for display
export interface BasicUser extends Pick<BaseUser, 'id' | 'name' | 'email' | 'username'> {}

// Household Member
export interface HouseholdMember {
  userId: string
  role: UserRole
  user: BasicUser
}

// User-Household relationship
export interface UserOnHousehold {
  user: User
  userId: string
  household: Household
  householdId: string
  role: UserRole
  joinedAt: string
  createdAt: string
  updatedAt: string
}

// List Item
export interface ListItem {
  id: string
  text: string
  description: string | null
  completed: boolean
  completedAt: string | null
  priority: Priority | null
  dueDate: string | null
  list: List
  listId: string
  createdBy: BasicUser
  createdById: string
  completedBy: BasicUser | null
  completedById: string | null
  createdAt: string
  updatedAt: string
}

// List with items
export interface ListWithItems {
  id: string
  name: string
  description: string | null
  type: ListType
  isArchived: boolean
  householdId: string
  createdById: string
  items: ListItem[]
  createdBy: BasicUser
  createdAt: string
  updatedAt: string
}

// Base List (without relations)
export interface List {
  id: string
  name: string
  description: string | null
  type: ListType
  isArchived: boolean
  householdId: string
  createdById: string
  createdAt: string
  updatedAt: string
  household: Household
  createdBy: User
  items: ListItem[]
}

// Household with basic relations
export interface Household {
  id: string
  name: string
  description: string | null
  secret: string | null
  createdAt: string
  updatedAt: string
  members: HouseholdMember[]
  lists: List[]
}

// Verification Code
export interface VerificationCode {
  id: string
  code: string
  householdId: string
  expiresAt: string
  used: boolean
  createdAt: string
  updatedAt: string
}

// ===== Request/Response DTOs =====

// Household DTOs
export interface CreateHouseholdInput {
  name: string
  description?: string
  secret?: string
}

export interface UpdateHouseholdInput {
  name?: string
  description?: string | null
  secret?: string | null
}

// List DTOs
export interface CreateListInput {
  name: string
  description?: string
  type: ListType
  householdId: string
}

export interface UpdateListInput extends Partial<CreateListInput> {
  isArchived?: boolean
}

// List Item DTOs
export interface CreateListItemInput {
  text: string
  description?: string
  priority?: Priority
  dueDate?: string
  listId: string
}

export interface UpdateListItemInput {
  text?: string
  description?: string | null
  completed?: boolean
  priority?: Priority | null
  dueDate?: string | null
}

export interface HouseholdData extends Omit<Household, 'members' | 'lists'> {
  members: HouseholdMember[]
  lists: ListWithItems[]
}
