import { useAuth, useUser } from '@clerk/clerk-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { CheckSquare, ShoppingCart } from 'lucide-react'
import { useCallback } from 'react'

import config from '../config'
import type { HouseholdData, List, ListItem, ListType, Priority } from '../models/models.ts'
import { selectedHouseholdAtom } from '../store/store.ts'
import { getHeaders } from '../utils/get-headers.ts'
import { AddTodoForm } from './add-to-do-form.tsx'
import { TodoItem } from './to-do-item.tsx'
import { Badge } from './ui/badge.tsx'
import { Button } from './ui/button.tsx'
import { Card, CardContent, CardDescription, CardTitle } from './ui/card.tsx'
import { Skeleton } from './ui/skeleton.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.tsx'

async function createListItem(
  newItem: {
    text: string
    listId: string
    description?: string
    priority?: Priority
    dueDate?: string
  },
  getToken: () => Promise<string>
) {
  const token = await getToken()
  const response = await fetch(`${config.apiBaseUrl}/api/lists/${newItem.listId}/items`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({
      text: newItem.text,
      description: newItem.description,
      priority: newItem.priority,
      dueDate: newItem.dueDate,
      listId: newItem.listId,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to create item')
  }

  return response.json()
}

async function toggleListItem(itemId: string, completed: boolean, getToken: () => Promise<string>) {
  const token = await getToken()

  try {
    const response = await fetch(`${config.apiBaseUrl}/api/list-items/${itemId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ completed }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error('Failed to update item. Status:', response.status, 'Response:', data)
      throw new Error(data.message || `Failed to update item: ${response.statusText}`)
    }

    return data
  } catch (error) {
    console.error('Error in toggleListItem:', error)
    throw error
  }
}

async function deleteListItem(itemId: string, getToken: () => Promise<string>) {
  const token = await getToken()
  const response = await fetch(`${config.apiBaseUrl}/api/lists/items/${itemId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  })

  if (!response.ok) {
    throw new Error('Failed to delete item')
  }
}

function getListByType(lists: List[] = [], type: ListType) {
  if (!lists) return null
  return lists.find((list) => list.type.toUpperCase() === type.toUpperCase())
}

function Household() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  const [selectedHousehold, setSelectedHousehold] = useAtom(selectedHouseholdAtom)

  const todoList = getListByType(selectedHousehold.lists, 'TODO')
  const shoppingList = getListByType(selectedHousehold.lists, 'SHOPPING')

  const priorityOrder = {
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  }

  const activeTodos: ListItem[] =
    todoList?.items
      .filter((item: ListItem) => !item.completed)
      .sort((a: ListItem, b: ListItem) => {
        const priorityA: Priority = a.priority || 'MEDIUM'
        const priorityB: Priority = b.priority || 'MEDIUM'
        return priorityOrder[priorityA] - priorityOrder[priorityB]
      }) || []

  const completedTodos = todoList?.items.filter((item) => item.completed) || []

  const activeGroceries = shoppingList?.items.filter((item) => !item.completed) || []
  const completedGroceries = shoppingList?.items.filter((item) => item.completed) || []

  // Mutations
  const addItemMutation = useMutation({
    mutationFn: async (newItem: Parameters<typeof createListItem>[0]) => {
      const token = await getToken()
      return createListItem(newItem, () => Promise.resolve(token || ''))
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['household', selectedHousehold.id] })

      // Snapshot the previous value
      const previousHousehold = queryClient.getQueryData<HouseholdData>([
        'household',
        selectedHousehold.id,
      ])

      if (previousHousehold) {
        // Generate a temporary ID for the optimistic update
        const tempId = `temp-${Date.now()}`
        const newItemWithId = {
          ...newItem,
          id: tempId,
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdById: user?.id || '',
          createdBy: {
            id: user?.id || '',
            name: user?.fullName || 'You',
          },
          completedBy: null,
          completedAt: null,
        }

        const updatedLists = previousHousehold.lists.map((list) => {
          if (list.id === newItem.listId) {
            return {
              ...list,
              items: [...list.items, newItemWithId],
            }
          }
          return list
        })

        queryClient.setQueryData(['household', selectedHousehold.id], {
          ...previousHousehold,
          lists: updatedLists,
        })
      }

      return { previousHousehold }
    },
    onError: (err, newItem, context) => {
      // Rollback on error
      if (context?.previousHousehold) {
        queryClient.setQueryData(['household', selectedHousehold.id], context.previousHousehold)
      }
    },
    onSettled: () => {
      refreshHousehold()
    },
  })

  const toggleItemMutation = useMutation({
    mutationFn: async ({ itemId, completed }: { itemId: string; completed: boolean }) => {
      const token = await getToken()
      return toggleListItem(itemId, completed, () => Promise.resolve(token || ''))
    },
    onMutate: async ({ itemId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['household', selectedHousehold.id] })

      const previousHousehold = queryClient.getQueryData<HouseholdData>([
        'household',
        selectedHousehold.id,
      ])

      if (previousHousehold) {
        const updatedLists = previousHousehold.lists.map((list) => ({
          ...list,
          items: list.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  completed,
                  completedAt: completed ? new Date().toISOString() : null,
                  completedBy: completed
                    ? { id: user?.id || '', name: user?.fullName || user?.username || 'You' }
                    : null,
                }
              : item
          ),
        }))

        queryClient.setQueryData(['household', selectedHousehold.id], {
          ...previousHousehold,
          lists: updatedLists,
        })
      }

      return { previousHousehold }
    },
    onError: (err, variables, context) => {
      if (context?.previousHousehold) {
        queryClient.setQueryData(['household', selectedHousehold.id], context.previousHousehold)
      }
    },
    onSettled: () => {
      refreshHousehold()
    },
  })

  const refreshHousehold = async () => {
    if (!selectedHousehold) return

    const token = await getToken()
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/households/${selectedHousehold.id}`, {
        headers: getHeaders(token),
      })

      if (response.ok) {
        const updatedHousehold = await response.json()
        // @ts-ignore
        setSelectedHousehold(updatedHousehold)

        queryClient.setQueryData(['household', selectedHousehold.id], updatedHousehold)
        return updatedHousehold
      }
    } catch (error) {
      console.error('Error refreshing household:', error)
      throw error
    }
  }

  const editItemMutation = useMutation({
    mutationFn: async ({ itemId, text }: { itemId: string; text: string }) => {
      const token = await getToken()
      return fetch(`${config.apiBaseUrl}/api/lists/items/${itemId}`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify({ text }),
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to update item')
        return res.json()
      })
    },
    onMutate: async ({ itemId, text }) => {
      await queryClient.cancelQueries({ queryKey: ['household', selectedHousehold?.id] })
      const previousHousehold = queryClient.getQueryData<HouseholdData>([
        'household',
        selectedHousehold?.id,
      ])

      if (previousHousehold) {
        queryClient.setQueryData(['household', selectedHousehold?.id], {
          ...previousHousehold,
          lists: previousHousehold.lists.map((list) => ({
            ...list,
            items: list.items.map((item) =>
              item.id === itemId ? { ...item, text, updatedAt: new Date().toISOString() } : item
            ),
          })),
        })
      }
      return { previousHousehold }
    },
    onError: (err, variables, context) => {
      if (context?.previousHousehold) {
        queryClient.setQueryData(['household', selectedHousehold?.id], context.previousHousehold)
      }
    },
    onSettled: () => {
      refreshHousehold()
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const token = await getToken()
      return deleteListItem(itemId, () => Promise.resolve(token || ''))
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ['household', selectedHousehold.id] })

      const previousHousehold = queryClient.getQueryData<HouseholdData>([
        'household',
        selectedHousehold.id,
      ])

      if (previousHousehold) {
        const updatedLists = previousHousehold.lists.map((list) => ({
          ...list,
          items: list.items.filter((item) => item.id !== itemId),
        }))

        queryClient.setQueryData(['household', selectedHousehold.id], {
          ...previousHousehold,
          lists: updatedLists,
        })
      }

      return { previousHousehold }
    },
    onError: (err, variables, context) => {
      if (context?.previousHousehold) {
        queryClient.setQueryData(['household', selectedHousehold.id], context.previousHousehold)
      }
    },
    onSettled: () => {
      refreshHousehold()
    },
  })

  async function handleDeleteCompletedItems(listId: string) {
    const token = await getToken()

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/lists/${listId}/items`, {
        method: 'DELETE',
        headers: getHeaders(token),
      })

      if (!response.ok) {
        throw new Error('Failed to delete completed items')
      }

      if (response.ok) {
        refreshHousehold()
      }
      return response.json()
    } catch (error) {
      console.error('Error deleting completed items:', error)
      throw error
    }
  }

  const handleAddItem = (itemData: { text: string; priority?: Priority; type: ListType }) => {
    const listType = itemData.type.toUpperCase() as 'TODO' | 'SHOPPING'
    const list = listType === 'TODO' ? todoList : shoppingList

    if (!list) {
      console.error('No list found for type:', listType)
      return
    }

    const newItem = {
      text: itemData.text,
      listId: list.id,
      priority: (itemData.priority?.toUpperCase() || 'MEDIUM') as Priority,
    }

    addItemMutation.mutate(newItem, {
      onError: (error) => {
        console.error('Error adding item:', error)
      },
    })
  }

  const handleToggleItem = (itemId: string, completed: boolean) => {
    toggleItemMutation.mutate({ itemId, completed })
  }

  const handleDeleteItem = (itemId: string) => {
    deleteItemMutation.mutate(itemId)
  }

  const handleEditItem = useCallback(
    (itemId: string, text: string) => {
      if (!selectedHousehold) return Promise.reject(new Error('No household selected'))
      return editItemMutation.mutateAsync({ itemId, text })
    },
    [selectedHousehold, editItemMutation]
  )

  if (!selectedHousehold) {
    return (
      <div className='space-y-4'>
        <div className='flex justify-between items-center'>
          <Skeleton className='h-10 w-32' />
          <div className='flex space-x-2'>
            <Skeleton className='h-10 w-24' />
            <Skeleton className='h-10 w-24' />
          </div>
        </div>
        <div className='space-y-2'>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className='h-16 w-full' />
          ))}
        </div>
      </div>
    )
  }

  return (
    <Tabs defaultValue='todos' className='space-y-4'>
      <TabsList className='grid w-full grid-cols-2'>
        <TabsTrigger value='todos' className='gap-2'>
          <CheckSquare className='h-4 w-4' />
          Tasks
          {activeTodos.length > 0 && (
            <Badge variant='secondary' className='ml-1'>
              {activeTodos.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value='groceries' className='gap-2'>
          <ShoppingCart className='h-4 w-4' />
          Groceries
          {activeGroceries.length > 0 && (
            <Badge variant='secondary' className='ml-1'>
              {activeGroceries.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value='todos' className='space-y-4'>
        <AddTodoForm
          onAdd={(item) => handleAddItem(item)}
          type='TODO'
          placeholder='Add a new task...'
          isSubmitting={addItemMutation.isPending}
        />

        {activeTodos.length > 0 && (
          <div className='space-y-2'>
            <h3 className='text-sm font-medium text-muted-foreground'>Active Tasks</h3>
            {activeTodos.map((item) => (
              <TodoItem
                key={item.id}
                item={item}
                typeOfList='TODO'
                onToggle={(completed) => handleToggleItem(item.id, completed)}
                onEdit={(id, text) => handleEditItem(id, text)}
                onDelete={() => handleDeleteItem(item.id)}
              />
            ))}
          </div>
        )}

        {completedTodos.length > 0 && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-medium text-muted-foreground'>
                Completed {completedTodos.length >= 3 ? `(${completedTodos.length})` : ''}
              </h3>
              <Button
                variant='destructive'
                size='sm'
                onClick={() => handleDeleteCompletedItems(todoList.id)}
              >
                Clear all
              </Button>
            </div>
            {completedTodos.map((item) => (
              <TodoItem
                key={item.id}
                item={item}
                typeOfList='TODO'
                onToggle={(completed) => handleToggleItem(item.id, completed)}
                onEdit={(id, text) => handleEditItem(id, text)}
                onDelete={() => handleDeleteItem(item.id)}
              />
            ))}
          </div>
        )}

        {todoList?.items.length === 0 && (
          <Card className='border-dashed border-2'>
            <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
              <CheckSquare className='h-12 w-12 text-muted-foreground mb-4' />
              <CardTitle className='text-lg mb-2'>No tasks yet</CardTitle>
              <CardDescription>Add your first task to get started</CardDescription>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value='groceries' className='space-y-4'>
        <AddTodoForm
          onAdd={(item) => handleAddItem({ ...item, type: 'SHOPPING' })}
          type='SHOPPING'
          placeholder='Add shopping item...'
          isSubmitting={addItemMutation.isPending}
        />

        {activeGroceries.length > 0 && (
          <div className='space-y-2'>
            <h3 className='text-sm font-medium text-muted-foreground'>Shopping List</h3>
            {activeGroceries.map((item) => (
              <TodoItem
                key={item.id}
                item={item}
                typeOfList='SHOPPING'
                onToggle={(completed) => handleToggleItem(item.id, completed)}
                onEdit={(id, text) => handleEditItem(id, text)}
                onDelete={() => handleDeleteItem(item.id)}
              />
            ))}
          </div>
        )}

        {completedGroceries.length > 0 && (
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-medium text-muted-foreground'>
                In Cart {completedGroceries.length >= 3 ? `(${completedGroceries.length})` : ''}
              </h3>
              <Button
                variant='destructive'
                size='sm'
                onClick={() => handleDeleteCompletedItems(shoppingList.id)}
              >
                Clear all
              </Button>
            </div>
            {completedGroceries.map((item) => (
              <TodoItem
                key={item.id}
                item={item}
                typeOfList='SHOPPING'
                onToggle={(completed) => handleToggleItem(item.id, completed)}
                onEdit={(id, text) => handleEditItem(id, text)}
                onDelete={() => handleDeleteItem(item.id)}
              />
            ))}
          </div>
        )}

        {shoppingList?.items.length === 0 && (
          <Card className='border-dashed border-2'>
            <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
              <ShoppingCart className='h-12 w-12 text-muted-foreground mb-4' />
              <CardTitle className='text-lg mb-2'>No groceries yet</CardTitle>
              <CardDescription>Add items to your shopping list</CardDescription>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  )
}

export default Household
