import { Plus } from 'lucide-react'
import { useState } from 'react'
import * as React from 'react'

import type { ListType, Priority } from '../models/models.ts'
import { Button } from './ui/button.tsx'
import { Card, CardContent } from './ui/card.tsx'
import { Input } from './ui/input.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.tsx'

interface AddTodoFormProps {
  // onAdd: ({ text, priority, type }: { text: string; priority?: Priority; type: ListType }) => void
  onAdd: ({ text, priority, type }: { text: string; priority?: Priority; type: ListType }) => void
  type: ListType
  placeholder: string
  isSubmitting?: boolean
}

const defaultPriority: Priority = 'MEDIUM'

export function AddTodoForm({ onAdd, type, placeholder, isSubmitting = false }: AddTodoFormProps) {
  const [text, setText] = useState('')
  const [priority, setPriority] = useState<Priority>(defaultPriority)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onAdd({
        text: text.trim(),
        priority: type === 'TODO' ? priority : undefined,
        type,
      })
      setText('')
      setPriority(defaultPriority)
      setIsExpanded(false)
    }
  }

  return (
    <Card>
      <CardContent className='p-3'>
        <form onSubmit={handleSubmit} className='space-y-3'>
          <div className='flex gap-2'>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder || `Add new ${type}...`}
              onFocus={() => setIsExpanded(true)}
              className='flex-1'
            />
            <Button type='submit' size='sm' disabled={!text.trim() || isSubmitting}>
              <Plus className='h-4 w-4' />
            </Button>
          </div>

          {isExpanded && type === 'TODO' && (
            <div className='flex gap-2'>
              <Select value={priority} onValueChange={(value: Priority) => setPriority(value)}>
                <SelectTrigger className='w-32'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='LOW'>Low</SelectItem>
                  <SelectItem value='MEDIUM'>Medium</SelectItem>
                  <SelectItem value='HIGH'>High</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setIsExpanded(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
