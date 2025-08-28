import { CheckSquare, List, MoreVertical, ShoppingCart, Users } from 'lucide-react'

import { Button } from './ui/button.tsx'
import { Card, CardHeader, CardTitle } from './ui/card.tsx'

interface User {
  id: string
  name: string | null
  email: string
  username?: string | null
}

interface Member {
  user: User
  role: string
}

interface ListItem {
  id: string
  name: string
  completed: boolean
}

interface HouseholdList {
  id: string
  name: string
  items: ListItem[]
  createdBy: Pick<User, 'id' | 'name'>
}

interface HouseholdCardProps {
  household: {
    id: string
    name: string
    members: Member[]
    lists: HouseholdList[]
    todoCount?: number
    groceryCount?: number
  }
  onClick: () => void
}

export function HouseholdCard({ household, onClick }: HouseholdCardProps) {
  const memberCount = household.members?.length || 0

  const displayMembers = household.members?.slice(0, 3) || []
  return (
    <Card
      className='cursor-pointer hover:shadow-md transition-shadow w-full overflow-hidden'
      onClick={onClick}
    >
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between w-full'>
          <CardTitle className='text-lg'>{household.name}</CardTitle>
          <div className='flex items-center gap-2'>
            <div className='flex -space-x-2'>
              {displayMembers.map((member) => (
                <div
                  key={member.user.id}
                  className='w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center border-2 border-background'
                >
                  {(member.user.username || member.user.email).charAt(0).toUpperCase()}
                </div>
              ))}
              {memberCount > 3 && (
                <div className='w-7 h-7 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center border-2 border-background'>
                  +{memberCount - 3}
                </div>
              )}
            </div>
            <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
              <MoreVertical className='h-4 w-4' />
            </Button>
          </div>
        </div>
        <div className='grid grid-cols-3 gap-4 text-sm text-muted-foreground mt-3'>
          <div className='flex flex-col items-center justify-center p-2 bg-muted/20 rounded-lg'>
            <div className='flex items-center gap-1'>
              <Users className='h-4 w-4' />
              <span className='font-medium'>{memberCount}</span>
            </div>
            <span className='text-xs mt-1'>{memberCount === 1 ? 'Member' : 'Members'}</span>
          </div>

          <div className='flex flex-col items-center justify-center p-2 bg-muted/20 rounded-lg'>
            <div className='flex items-center gap-1'>
              <ShoppingCart className='h-4 w-4' />
              <span className='font-medium'>{household.lists?.length || 0}</span>
            </div>
            <span className='text-xs mt-1'>{household.lists?.length === 1 ? 'Item' : 'Items'}</span>
          </div>

          <div className='flex flex-col items-center justify-center p-2 bg-muted/20 rounded-lg'>
            <div className='flex items-center gap-1'>
              <CheckSquare className='h-4 w-4' />
              <span className='font-medium'>
                {household.lists?.reduce((total, list) => total + list.items.length, 0) || 0}
              </span>
            </div>
            <span className='text-xs mt-1'>
              {household.lists?.reduce((total, list) => total + list.items.length, 0) === 1
                ? 'Task'
                : 'Tasks'}
            </span>
          </div>
        </div>

        {household.lists && household.lists.length > 0 && (
          <div className='mt-4'>
            <h4 className='text-sm font-medium mb-2'>Recent Lists</h4>
            <div className='space-y-2'>
              {household.lists.slice(0, 2).map((list) => (
                <div
                  key={list.id}
                  className='flex items-center justify-between p-2 bg-muted/10 rounded-md hover:bg-muted/20 transition-colors'
                >
                  <span className='text-sm font-medium truncate pr-2'>{list.name}</span>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs px-2 py-1 bg-muted/30 rounded-full'>
                      {list.items.length} {list.items.length === 1 ? 'item' : 'items'}
                    </span>
                    {list.createdBy?.name && (
                      <span className='text-xs text-muted-foreground'>
                        by {list.createdBy.name.split(' ')[0]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {household.lists.length > 2 && (
                <div className='text-center text-sm text-muted-foreground pt-1'>
                  +{household.lists.length - 2} more{' '}
                  {household.lists.length - 2 === 1 ? 'list' : 'lists'}
                </div>
              )}
            </div>
          </div>
        )}
      </CardHeader>
    </Card>
  )
}
