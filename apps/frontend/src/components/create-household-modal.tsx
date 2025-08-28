import { useAuth } from '@clerk/clerk-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { HOUSEHOLD_MIN_NAME_LENGTH } from '@household/shared/types/household-model'

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

interface ModalProps {
  open: boolean
  setOpen: (open: boolean) => void
}

type FormValues = {
  name: string
}

const schema = z.object({
  name: z
    .string()
    .min(HOUSEHOLD_MIN_NAME_LENGTH, `At least ${HOUSEHOLD_MIN_NAME_LENGTH} characters required`)
    .max(256, 'Too long'),
})

function CreateHouseholdModal({ open, setOpen }: ModalProps) {
  const queryClient = useQueryClient()
  const { getToken } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    criteriaMode: 'firstError',
  })

  const createHouseholdMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const token = await getToken()
      const response = await fetch('http://localhost:3000/api/households', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: data.name }),
      })

      if (!response.ok) {
        throw new Error('Failed to create household')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] })
      reset()
      setOpen(false)
    },
    onError: (error) => {
      console.error('Error creating household:', error)
    },
  })

  const onSubmit = (data: FormValues) => {
    createHouseholdMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='sm:max-w-md'>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Create New Household</DialogTitle>
            <DialogDescription>
              Give your household a name to get started with shared tasks and lists.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='household-name'>Household Name</Label>
              <div className='space-y-1'>
                <Input
                  {...register('name')}
                  placeholder='Name'
                  aria-invalid={errors.name ? 'true' : 'false'}
                  className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {errors.name && (
                  <p className='text-sm text-red-600' role='alert'>
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={!isValid || createHouseholdMutation.isPending}
              className='w-full'
            >
              {createHouseholdMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateHouseholdModal
