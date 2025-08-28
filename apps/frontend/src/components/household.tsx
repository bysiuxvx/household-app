import { useAuth, useUser } from '@clerk/clerk-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { CheckSquare, ShoppingCart } from 'lucide-react'
import { useCallback } from 'react'

import config from '../config'
import type { ItemType, Priority } from '../models/models.ts'
import { selectedHouseholdAtom } from '../store'
import { AddTodoForm } from './add-to-do-form.tsx'
import { TodoItem } from './to-do-item.tsx'
import { Badge } from './ui/badge.tsx'
import { Card, CardContent, CardDescription, CardTitle } from './ui/card.tsx'
import { Skeleton } from './ui/skeleton.tsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.tsx'

interface User {
  id: string
  name: string | null
  email: string
  username: string | null
}

interface ListItem {
  id: string
  text: string
  description: string | null
  completed: boolean
  completedAt: string | null
  priority: Priority | null
  dueDate: string | null
  listId: string
  createdById: string
  createdBy: Pick<User, 'id' | 'name'>
  completedBy: Pick<User, 'id' | 'name'> | null
  createdAt: string
  updatedAt: string
}

interface List {
  id: string
  name: string
  type: ItemType
  householdId: string
  createdById: string
  items: ListItem[]
  createdBy: Pick<User, 'id' | 'name'>
}

interface HouseholdData {
  id: string
  name: string
  description: string | null
  members: Array<{
    userId: string
    role: string
    user: Pick<User, 'id' | 'name' | 'email' | 'username'>
  }>
  lists: List[]
}

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
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      text: newItem.text,
      description: newItem.description,
      priority: newItem.priority,
      dueDate: newItem.dueDate,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to create item')
  }

  return response.json()
}

async function toggleListItem(itemId: string, completed: boolean, getToken: () => Promise<string>) {
  const token = await getToken()
  console.log('Toggling item:', { itemId, completed, token: token ? 'token exists' : 'no token' })

  try {
    const response = await fetch(`${config.apiBaseUrl}/api/list-items/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completed }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error('Failed to update item. Status:', response.status, 'Response:', data)
      throw new Error(data.message || `Failed to update item: ${response.statusText}`)
    }

    console.log('Item updated successfully:', data)
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
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to delete item')
  }
}

function getListByType(lists: List[] = [], type: 'TODO' | 'SHOPPING') {
  if (!lists) return null
  return lists.find((list) => list.type.toUpperCase() === type.toUpperCase())
}

function getPriority(
  priority: string | null | undefined,
  defaultValue: Priority = 'MEDIUM'
): Priority {
  const prio = priority?.toLowerCase()
  return prio === 'low' || prio === 'high' ? prio : defaultValue
}

function Household() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  const [selectedHousehold, setHousehold] = useAtom(selectedHouseholdAtom)

  if (!selectedHousehold) {
    return <div>No household selected</div>
  }

  const household = selectedHousehold as HouseholdData

  const todoList = getListByType(household.lists, 'TODO')
  const shoppingList = getListByType(household.lists, 'SHOPPING')

  const activeTodos = todoList?.items.filter((item) => !item.completed) || []
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
      await queryClient.cancelQueries({ queryKey: ['household', household.id] })

      // Snapshot the previous value
      const previousHousehold = queryClient.getQueryData<HouseholdData>(['household', household.id])

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

        queryClient.setQueryData(['household', household.id], {
          ...previousHousehold,
          lists: updatedLists,
        })
      }

      return { previousHousehold }
    },
    onError: (err, newItem, context) => {
      // Rollback on error
      if (context?.previousHousehold) {
        queryClient.setQueryData(['household', household.id], context.previousHousehold)
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
      await queryClient.cancelQueries({ queryKey: ['household', household.id] })

      const previousHousehold = queryClient.getQueryData<HouseholdData>(['household', household.id])

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

        queryClient.setQueryData(['household', household.id], {
          ...previousHousehold,
          lists: updatedLists,
        })
      }

      return { previousHousehold }
    },
    onError: (err, variables, context) => {
      if (context?.previousHousehold) {
        queryClient.setQueryData(['household', household.id], context.previousHousehold)
      }
    },
    onSettled: () => {
      refreshHousehold()
    },
  })

  // Function to fetch and update a single household
  const refreshHousehold = async () => {
    if (!selectedHousehold) return

    const token = await getToken()
    try {
      const response = await fetch(`${config.apiBaseUrl}/api/households/${selectedHousehold.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const updatedHousehold = await response.json()

        // Update the selectedHouseholdAtom with fresh data
        setHousehold(updatedHousehold)

        // Also update the query cache in case it's being used elsewhere
        queryClient.setQueryData(['household', selectedHousehold.id], updatedHousehold)

        return updatedHousehold
      }
    } catch (error) {
      console.error('Error refreshing household:', error)
      throw error // Re-throw to allow error handling in the calling function
    }
  }

  const editItemMutation = useMutation({
    mutationFn: async ({ itemId, text }: { itemId: string; text: string }) => {
      const token = await getToken()
      return fetch(`${config.apiBaseUrl}/api/lists/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      }).then((res) => {
        if (!res.ok) throw new Error('Failed to update item')
        return res.json()
      })
    },
    onMutate: async ({ itemId, text }) => {
      await queryClient.cancelQueries({ queryKey: ['household', household?.id] })
      const previousHousehold = queryClient.getQueryData<HouseholdData>([
        'household',
        household?.id,
      ])

      if (previousHousehold) {
        queryClient.setQueryData(['household', household?.id], {
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
        queryClient.setQueryData(['household', household?.id], context.previousHousehold)
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
      await queryClient.cancelQueries({ queryKey: ['household', household.id] })

      const previousHousehold = queryClient.getQueryData<HouseholdData>(['household', household.id])

      if (previousHousehold) {
        const updatedLists = previousHousehold.lists.map((list) => ({
          ...list,
          items: list.items.filter((item) => item.id !== itemId),
        }))

        queryClient.setQueryData(['household', household.id], {
          ...previousHousehold,
          lists: updatedLists,
        })
      }

      return { previousHousehold }
    },
    onError: (err, variables, context) => {
      if (context?.previousHousehold) {
        queryClient.setQueryData(['household', household.id], context.previousHousehold)
      }
    },
    onSettled: () => {
      refreshHousehold()
    },
  })

  // Handler functions
  const handleAddItem = (itemData: { text: string; priority?: Priority; type: ItemType }) => {
    console.log('handleAddItem called with:', itemData)
    const listType = itemData.type.toUpperCase() as 'TODO' | 'SHOPPING'
    const list = listType === 'TODO' ? todoList : shoppingList
    console.log('Selected list:', list)

    if (!list) {
      console.error('No list found for type:', listType)
      return
    }

    const newItem = {
      text: itemData.text,
      listId: list.id,
      priority: (itemData.priority?.toUpperCase() || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
    }

    console.log('Calling addItemMutation with:', newItem)
    addItemMutation.mutate(newItem, {
      onError: (error) => {
        console.error('Error adding item:', error)
      },
      onSuccess: (data) => {
        console.log('Successfully added item:', data)
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
      if (!household) return Promise.reject(new Error('No household selected'))
      return editItemMutation.mutateAsync({ itemId, text })
    },
    [household, editItemMutation]
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

  // Error handling is now done at the mutation level

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
                item={{
                  ...item,
                  type: 'TODO',
                  assignedTo: item.completedBy?.name || item.createdBy?.name || 'You',
                  priority: item.priority as Priority | undefined,
                }}
                onToggle={(completed) => handleToggleItem(item.id, completed)}
                onEdit={(id, text) => handleEditItem(id, text)}
                onDelete={() => handleDeleteItem(item.id)}
              />
            ))}
          </div>
        )}

        {completedTodos.length > 0 && (
          <div className='space-y-2'>
            <h3 className='text-sm font-medium text-muted-foreground'>Completed</h3>
            {completedTodos.map((item) => (
              <TodoItem
                key={item.id}
                item={{
                  ...item,
                  type: 'TODO',
                  assignedTo: item.completedBy?.name || item.createdBy?.name || 'You',
                  priority: item.priority as Priority | undefined,
                }}
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
          onAdd={(item) => handleAddItem({ ...item, type: 'GROCERY' })}
          type='GROCERY'
          placeholder='Add grocery item...'
          isSubmitting={addItemMutation.isPending}
        />

        {activeGroceries.length > 0 && (
          <div className='space-y-2'>
            <h3 className='text-sm font-medium text-muted-foreground'>Shopping List</h3>
            {activeGroceries.map((item) => (
              <TodoItem
                key={item.id}
                item={{
                  ...item,
                  type: 'GROCERY',
                  priority: item.priority || undefined,
                  assignedTo: item.completedBy?.name || item.createdBy?.name || undefined,
                }}
                onToggle={(completed) => handleToggleItem(item.id, completed)}
                onEdit={(id, text) => handleEditItem(id, text)}
                onDelete={() => handleDeleteItem(item.id)}
              />
            ))}
          </div>
        )}

        {completedGroceries.length > 0 && (
          <div className='space-y-2'>
            <h3 className='text-sm font-medium text-muted-foreground'>In Cart</h3>
            {completedGroceries.map((item) => (
              <TodoItem
                key={item.id}
                item={{
                  ...item,
                  type: 'GROCERY',
                  assignedTo: item.completedBy?.name || item.createdBy?.name || undefined,
                }}
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
