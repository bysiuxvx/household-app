import { CheckSquare, MoreVertical, ShoppingCart, Users } from 'lucide-react'

import type { Household as HouseholdType, List, ListItem } from '../models/models.ts'
import { Button } from './ui/button.tsx'
import { Card, CardHeader, CardTitle } from './ui/card.tsx'

interface HouseholdCardProps {
  household: HouseholdType
  onClick: () => void
}

export function HouseholdCard({ household, onClick }: HouseholdCardProps) {
  const memberCount = household.members?.length || 0

  const activeGroceryItems: ListItem[] = household.lists
    ?.find((list: List) => list.type === 'SHOPPING')
    ?.items?.filter((item: ListItem) => !item.completed)
  const groceryCount: number = activeGroceryItems?.length || 0

  const activeTodoItems: ListItem[] = household.lists
    ?.find((list: List) => list.type === 'TODO')
    ?.items?.filter((item: ListItem) => !item.completed)
  const todoCount: number = activeTodoItems?.length || 0

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
              <CheckSquare className='h-4 w-4' />
              <span className='font-medium'>{todoCount}</span>
            </div>
            <span className='text-xs mt-1'>{todoCount === 1 ? 'Task' : 'Tasks'}</span>
          </div>

          <div className='flex flex-col items-center justify-center p-2 bg-muted/20 rounded-lg'>
            <div className='flex items-center gap-1'>
              <ShoppingCart className='h-4 w-4' />
              <span className='font-medium'>{groceryCount || 0}</span>
            </div>
            <span className='text-xs mt-1'>{groceryCount === 1 ? 'Item' : 'Items'}</span>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
