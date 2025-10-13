import { formatDistanceToNow } from 'date-fns'
import { Check, Edit2, Loader, Trash2, X } from 'lucide-react'
import { useState } from 'react'

import type { ListItem, ListType } from '../models/models.ts'
import { Badge } from './ui/badge.tsx'
import { Button } from './ui/button.tsx'
import { Card, CardContent } from './ui/card.tsx'
import { Checkbox } from './ui/checkbox.tsx'
import { Input } from './ui/input.tsx'

interface TodoItemProps {
  item: ListItem
  onToggle: (completed: boolean) => void
  onEdit: (id: string, text: string) => void
  onDelete: (id: string) => void
  typeOfList: ListType
  isHandledItem: boolean
}

export function TodoItem({
  item,
  onToggle,
  onEdit,
  onDelete,
  typeOfList,
  isHandledItem,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(item.text)

  const handleSave = () => {
    if (editText.trim() === item.text) {
      setIsEditing(false)
      return
    }
    if (editText.trim()) {
      onEdit(item.id, editText.trim())
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditText(item.text)
    setIsEditing(false)
  }

  const priorityColors = {
    LOW: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    HIGH: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }

  const completedActionName: string = typeOfList === 'TODO' ? 'Completed' : 'Bought'

  return (
    <Card className={`transition-all relative ${item.completed ? 'opacity-60' : ''}`}>
      {isHandledItem && (
        <div className='absolute inset-0 backdrop-blur-xs z-10 flex items-center justify-center rounded-xl'>
          <Loader className='h-9 w-9 animate-spin' />
        </div>
      )}
      <CardContent className='p-3 relative z-0'>
        <div className='flex items-center gap-3'>
          <Checkbox
            checked={item.completed}
            onCheckedChange={(checked) => !isHandledItem && onToggle(checked === true)}
            className='mt-0.5'
            disabled={isHandledItem}
          />

          <div className='flex-1 min-w-0'>
            {isEditing ? (
              <div className='flex items-center gap-2'>
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className='h-8'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave()
                    if (e.key === 'Escape') handleCancel()
                  }}
                  autoFocus
                />
                <Button size='sm' variant='ghost' onClick={handleSave} className='h-8 w-8 p-0'>
                  <Check className='h-4 w-4' />
                </Button>
                <Button size='sm' variant='ghost' onClick={handleCancel} className='h-8 w-8 p-0'>
                  <X className='h-4 w-4' />
                </Button>
              </div>
            ) : (
              <div className='space-y-1'>
                <p className={`text-sm ${item.completed ? 'text-muted-foreground' : ''}`}>
                  {item.text}
                </p>
                <div className='flex items-center gap-2'>
                  {item.priority && typeOfList === 'TODO' && (
                    <Badge
                      variant='secondary'
                      className={`text-xs ${priorityColors[item.priority] || ''}`}
                    >
                      {item.priority}
                    </Badge>
                  )}
                  {item.createdBy?.username && typeOfList === 'TODO' && (
                    <Badge variant='outline' className='text-xs'>
                      {item.createdBy.username}
                    </Badge>
                  )}
                </div>
                <p className='text-xs text-muted-foreground'>
                  {item?.completedAt
                    ? `${completedActionName} ${formatDistanceToNow(new Date(item.completedAt), { addSuffix: true })}`
                    : `Added ${formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}`}
                </p>
              </div>
            )}
          </div>

          {!isEditing && (
            <div className='flex items-center gap-1'>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => !isHandledItem && setIsEditing(true)}
                className='h-8 w-8 p-0'
                disabled={isHandledItem}
              >
                <Edit2 className='h-4 w-4' />
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => !isHandledItem && onDelete(item.id)}
                className='h-8 w-8 p-0 text-destructive hover:text-destructive/90'
                disabled={isHandledItem}
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default TodoItem
