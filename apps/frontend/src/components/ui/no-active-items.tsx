import { CheckSquare, ShoppingCart } from 'lucide-react'

import type { ListType } from '../../models/models.ts'
import { Card, CardContent, CardDescription, CardTitle } from './card.tsx'

interface NoActiveItemsProps {
  listType: ListType
}

export function NoActiveItems({ listType }: NoActiveItemsProps) {
  return (
    <Card className='border-dashed border-2'>
      <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
        {listType === 'TODO' ? (
          <CheckSquare className='h-12 w-12 text-muted-foreground mb-4' />
        ) : (
          <ShoppingCart className='h-12 w-12 text-muted-foreground mb-4' />
        )}
        <CardTitle className='text-lg mb-2'>
          {listType === 'TODO' ? `No tasks yet` : `No groceries yet`}
        </CardTitle>
        <CardDescription>
          {listType === 'TODO'
            ? `Add your first task to get started`
            : `Add items to your shopping list`}
        </CardDescription>
      </CardContent>
    </Card>
  )
}
