import { useAuth, useUser } from '@clerk/clerk-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { CheckSquare, Loader, ShoppingCart } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import config from '../config'
import type {
  Household as HouseholdData,
  List,
  ListItem,
  ListType,
  Priority,
} from '../models/models.ts'
import { selectedHouseholdAtom } from '../store/store.ts'
import { getHeaders } from '../utils/get-headers.ts'
import { loadHouseholdById } from '../utils/query-functions.ts'
import { AddTodoForm } from './add-to-do-form.tsx'
import { TodoItem } from './to-do-item.tsx'
import { Badge } from './ui/badge.tsx'
import { Button } from './ui/button.tsx'
import { NoActiveItems } from './ui/no-active-items.tsx'
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
  const [clearingListId, setClearingListId] = useState<string | null>(null)
  const [completedTodos, setCompletedTodos] = useState<ListItem[]>([])
  const [completedGroceries, setCompletedGroceries] = useState<ListItem[]>([])

  const {
    data: householdData,
    isLoading,
    isSuccess,
    error,
  } = useQuery<HouseholdData>({
    queryKey: ['household', selectedHousehold?.id],
    queryFn: async () => {
      if (!selectedHousehold?.id) {
        throw new Error('No household ID provided')
      }
      return loadHouseholdById(selectedHousehold.id, getToken)
    },
    enabled: !!selectedHousehold?.id,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  })

  useEffect(() => {
    if (isSuccess && householdData) {
      // @ts-ignore
      setSelectedHousehold(householdData)
    }
  }, [isSuccess, householdData, setSelectedHousehold])

  const todoList: List = getListByType(householdData?.lists || [], 'TODO')
  const shoppingList: List = getListByType(householdData?.lists || [], 'SHOPPING')

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

  const activeGroceries = shoppingList?.items.filter((item) => !item.completed) || []

  useEffect(() => {
    setCompletedTodos(todoList?.items.filter((item) => item.completed) || [])
  }, [todoList?.items])

  useEffect(() => {
    setCompletedGroceries(shoppingList?.items.filter((item) => item.completed) || [])
  }, [shoppingList?.items])

  // Mutations
  const addItemMutation = useMutation({
    mutationFn: async (newItem: Parameters<typeof createListItem>[0]) => {
      const token = await getToken()
      return createListItem(newItem, () => Promise.resolve(token || ''))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household', selectedHousehold?.id] })
    },
    onError: (error) => {
      console.error('Error adding item:', error)
    },
  })

  const toggleItemMutation = useMutation({
    mutationFn: async ({ itemId, completed }: { itemId: string; completed: boolean }) => {
      const token = await getToken()
      return toggleListItem(itemId, completed, () => Promise.resolve(token || ''))
    },
    onMutate: async ({ itemId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['household', selectedHousehold?.id] })

      const previousHousehold = queryClient.getQueryData<HouseholdData>([
        'household',
        selectedHousehold?.id,
      ])

      // optimistically update the UI
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
                    ? { id: user?.id || '', name: user?.fullName || 'You' }
                    : null,
                }
              : item
          ),
        }))

        queryClient.setQueryData(['household', selectedHousehold?.id], {
          ...previousHousehold,
          lists: updatedLists,
        })
      }

      return { previousHousehold }
    },
    onError: (err, variables, context) => {
      // revert on error
      if (context?.previousHousehold) {
        queryClient.setQueryData(['household', selectedHousehold?.id], context.previousHousehold)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['household', selectedHousehold?.id] })
    },
  })

  const editItemMutation = useMutation({
    mutationFn: async ({ itemId, text }: { itemId: string; text: string }) => {
      const token = await getToken()
      const response = await fetch(`${config.apiBaseUrl}/api/lists/items/${itemId}`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error('Failed to update item')
      }
      return response.json()
    },
    onMutate: async ({ itemId, text }) => {
      await queryClient.cancelQueries({ queryKey: ['household', selectedHousehold?.id] })

      const previousHousehold = queryClient.getQueryData<HouseholdData>([
        'household',
        selectedHousehold?.id,
      ])

      // Optimistically update the UI
      if (previousHousehold) {
        const updatedLists = previousHousehold.lists.map((list) => ({
          ...list,
          items: list.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  text,
                  updatedAt: new Date().toISOString(),
                }
              : item
          ),
        }))

        queryClient.setQueryData(['household', selectedHousehold?.id], {
          ...previousHousehold,
          lists: updatedLists,
        })
      }

      return { previousHousehold }
    },
    onError: (err, variables, context) => {
      // revert on error
      if (context?.previousHousehold) {
        queryClient.setQueryData(['household', selectedHousehold?.id], context.previousHousehold)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['household', selectedHousehold?.id] })
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const token = await getToken()
      return deleteListItem(itemId, () => Promise.resolve(token || ''))
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ['household', selectedHousehold?.id] })

      const previousHousehold = queryClient.getQueryData<HouseholdData>([
        'household',
        selectedHousehold?.id,
      ])

      if (previousHousehold) {
        const updatedLists = previousHousehold.lists.map((list) => ({
          ...list,
          items: list.items.filter((item) => item.id !== itemId),
        }))

        queryClient.setQueryData(['household', selectedHousehold?.id], {
          ...previousHousehold,
          lists: updatedLists,
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
      // invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['household', selectedHousehold?.id] })
    },
  })

  async function handleDeleteCompletedItems(listId: string, listType: ListType) {
    setClearingListId(listId)
    const token = await getToken()

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/lists/${listId}/items`, {
        method: 'DELETE',
        headers: getHeaders(token),
      })

      if (!response.ok) {
        throw new Error('Failed to delete completed items')
      }

      await queryClient.invalidateQueries({ queryKey: ['household', selectedHousehold?.id] })

      if (listType === 'TODO') {
        setCompletedTodos([])
      } else {
        setCompletedGroceries([])
      }

      return await response.json()
    } catch (error) {
      console.error('Error deleting completed items:', error)
      throw error
    } finally {
      setClearingListId(null)
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

  if (isLoading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <Loader className='animate-spin h-12 w-12' />
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <p className='text-destructive'>Error loading household data. Please try again.</p>
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
                onClick={() => handleDeleteCompletedItems(todoList.id, 'TODO')}
                disabled={!!clearingListId}
              >
                {clearingListId ? 'Clearing...' : 'Clear all'}
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

        {!isLoading && todoList?.items.length === 0 && <NoActiveItems listType='TODO' />}
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
                onClick={() => handleDeleteCompletedItems(shoppingList.id, 'SHOPPING')}
                disabled={!!clearingListId}
              >
                {clearingListId ? 'Clearing...' : 'Clear all'}
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

        {!isLoading && shoppingList?.items.length === 0 && <NoActiveItems listType='SHOPPING' />}
      </TabsContent>
    </Tabs>
  )
}

export default Household
