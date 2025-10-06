import { useAuth } from '@clerk/clerk-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { HOUSEHOLD_MIN_NAME_LENGTH } from '@household/shared'

import config from '../config'
import { getHeaders } from '../utils/get-headers.ts'
import { Button } from './ui/button.tsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.tsx'
import { Input } from './ui/input.tsx'
import { Label } from './ui/label.tsx'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs.tsx'

interface ModalProps {
  open: boolean
  setOpen: (open: boolean) => void
}

type CreateHouseholdValues = {
  name: string
}

type JoinHouseholdValues = {
  secret: string
  verificationCode: string
}

const createHouseholdSchema = z.object({
  name: z
    .string()
    .min(HOUSEHOLD_MIN_NAME_LENGTH, `At least ${HOUSEHOLD_MIN_NAME_LENGTH} characters required`)
    .max(256, 'Too long'),
})

const joinHouseholdSchema = z.object({
  secret: z.string().min(1, 'Secret is required').max(256, 'Too long'),
  verificationCode: z.string().min(6, 'Verification code is required').max(6, 'Too long'),
})

function CreateHouseholdModal({ open, setOpen }: ModalProps) {
  const [isCreateView, setIsCreateView] = useState(true)
  const queryClient = useQueryClient()
  const { getToken } = useAuth()

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors, isValid: isCreateValid },
    reset: resetCreate,
  } = useForm<CreateHouseholdValues>({
    resolver: zodResolver(createHouseholdSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    criteriaMode: 'firstError',
  })

  const {
    register: registerJoin,
    handleSubmit: handleJoinSubmit,
    formState: { errors: joinErrors, isValid: isJoinValid },
    reset: resetJoin,
  } = useForm<JoinHouseholdValues>({
    resolver: zodResolver(joinHouseholdSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    criteriaMode: 'firstError',
  })

  const createHouseholdMutation = useMutation({
    mutationFn: async (data: CreateHouseholdValues) => {
      const token = await getToken()
      const response = await fetch(`${config.apiBaseUrl}/api/households`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({ name: data.name }),
      })

      if (!response.ok) {
        throw new Error('Failed to create household')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] })
      resetCreate()
      setOpen(false)
    },
    onError: (error) => {
      console.error('Error creating household:', error)
    },
  })

  const joinHouseholdMutation = useMutation({
    mutationFn: async (data: JoinHouseholdValues) => {
      const token = await getToken()
      const response = await fetch(`${config.apiBaseUrl}/api/verification/validate`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({
          code: data.verificationCode,
          secret: data.secret,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to join household')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] })
      resetJoin()
      setOpen(false)
    },
    onError: (error) => {
      console.error('Error joining household:', error)
    },
  })

  const onCreateSubmit = (data: CreateHouseholdValues) => {
    createHouseholdMutation.mutate(data)
  }
  const onJoinSubmit = (data: JoinHouseholdValues) => {
    joinHouseholdMutation.mutate(data)
  }

  const handleTabChange = (value: string) => {
    setIsCreateView(value === 'create')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          const timer = setTimeout(() => {
            resetCreate()
            resetJoin()
          }, 200)
          return () => clearTimeout(timer)
        }
      }}
    >
      <DialogContent className='sm:max-w-md top-[20%] translate-y-0 max-h-[90vh] flex flex-col'>
        <div className='overflow-hidden flex flex-col'>
          <DialogHeader className='pb-4'>
            <DialogTitle>
              {isCreateView ? 'Create New Household' : 'Join Existing Household'}
            </DialogTitle>
            <DialogDescription>
              {isCreateView
                ? 'Give your household a name to get started with shared tasks and lists.'
                : 'Enter the household secret and verification code to join an existing household.'}
            </DialogDescription>
          </DialogHeader>

          <div className='flex justify-center py-2'>
            <Tabs
              value={isCreateView ? 'create' : 'join'}
              onValueChange={handleTabChange}
              className='w-full'
            >
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='create'>Create</TabsTrigger>
                <TabsTrigger value='join'>Join</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {isCreateView ? (
          <form onSubmit={handleCreateSubmit(onCreateSubmit)}>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='household-name'>Household Name</Label>
                <div className='space-y-1'>
                  <Input
                    id='household-name'
                    placeholder='Enter household name'
                    {...registerCreate('name')}
                  />
                  {createErrors.name && (
                    <p className='text-sm text-red-500'>{createErrors.name.message}</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type='submit' disabled={!isCreateValid || createHouseholdMutation.isPending}>
                {createHouseholdMutation.isPending ? 'Creating...' : 'Create Household'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleJoinSubmit(onJoinSubmit)}>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='household-secret'>Household Secret</Label>
                <div className='space-y-1'>
                  <Input
                    id='household-secret'
                    placeholder='Enter household secret'
                    {...registerJoin('secret')}
                  />
                  {joinErrors.secret && (
                    <p className='text-sm text-red-500'>{joinErrors.secret.message}</p>
                  )}
                </div>
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='verification-code'>Verification Code</Label>
                <div className='space-y-1'>
                  <Input
                    id='verification-code'
                    placeholder='Enter verification code'
                    {...registerJoin('verificationCode')}
                  />
                  {joinErrors.verificationCode && (
                    <p className='text-sm text-red-500'>{joinErrors.verificationCode.message}</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type='submit' disabled={!isJoinValid || joinHouseholdMutation.isPending}>
                {joinHouseholdMutation.isPending ? 'Joining...' : 'Join Household'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default CreateHouseholdModal
