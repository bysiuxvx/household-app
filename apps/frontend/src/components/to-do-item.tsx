import { Check, Edit2, Trash2, X } from 'lucide-react'
import { useState } from 'react'

import type { ItemType, Priority } from '../models/models.ts'
import { Badge } from './ui/badge.tsx'
import { Button } from './ui/button.tsx'
import { Card, CardContent } from './ui/card.tsx'
import { Checkbox } from './ui/checkbox.tsx'
import { Input } from './ui/input.tsx'

interface TodoItemProps {
  item: {
    id: string
    text: string
    completed: boolean
    assignedTo?: string
    priority?: Priority
    type: ItemType
  }
  onToggle: (completed: boolean) => void
  onEdit: (id: string, text: string) => void
  onDelete: (id: string) => void
}

export function TodoItem({ item, onToggle, onEdit, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(item.text)

  const handleSave = () => {
    if (editText.trim()) {
      onEdit(item.id, editText.trim())
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditText(item.text)
    setIsEditing(false)
  }

  console.log(item.type)

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  }

  return (
    <Card className={`transition-all ${item.completed ? 'opacity-60' : ''}`}>
      <CardContent className='p-3'>
        <div className='flex items-center gap-3'>
          <Checkbox
            checked={item.completed}
            onCheckedChange={(checked) => onToggle(checked === true)}
            className='mt-0.5'
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
                  <Check className='h-3 w-3' />
                </Button>
                <Button size='sm' variant='ghost' onClick={handleCancel} className='h-8 w-8 p-0'>
                  <X className='h-3 w-3' />
                </Button>
              </div>
            ) : (
              <div className='space-y-1'>
                <p
                  className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}
                >
                  {item.text}
                </p>
                <div className='flex items-center gap-2'>
                  {item.priority && item.type === 'TODO' && (
                    <Badge
                      variant='secondary'
                      className={`text-xs ${priorityColors[item.priority]}`}
                    >
                      {item.priority}
                    </Badge>
                  )}
                  {item.assignedTo && item.type === 'TODO' && (
                    <Badge variant='outline' className='text-xs'>
                      {item.assignedTo}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {!isEditing && (
            <div className='flex items-center gap-1'>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setIsEditing(true)}
                className='h-8 w-8 p-0'
              >
                <Edit2 className='h-3 w-3' />
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => onDelete(item.id)}
                className='h-8 w-8 p-0 text-destructive hover:text-destructive'
              >
                <Trash2 className='h-3 w-3' />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default TodoItem
