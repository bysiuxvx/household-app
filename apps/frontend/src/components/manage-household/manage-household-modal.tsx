import { useAuth } from '@clerk/clerk-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAtom } from 'jotai'
import { Check, Edit2, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { HOUSEHOLD_MIN_SECRET_LENGTH } from '@household/shared'

import config from '../../config.ts'
import { selectedHouseholdAtom, useUserRole } from '../../store/store.ts'
import { Button } from '../ui/button.tsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog.tsx'
import { Input } from '../ui/input.tsx'
import { Label } from '../ui/label.tsx'
import MemberList from './member-list.tsx'

interface ModalProps {
  open: boolean
  setOpen: (open: boolean) => void
}

const schema = z.object({
  secret: z
    .string()
    .min(HOUSEHOLD_MIN_SECRET_LENGTH, `At least ${HOUSEHOLD_MIN_SECRET_LENGTH} characters required`)
    .max(20, 'Too long'),
})

type FormValues = {
  secret: string
}

function ManageHouseholdModal({ open, setOpen }: ModalProps) {
  const [isEditingSecret, setIsEditingSecret] = useState<boolean>(false)
  const [verificationCode, setVerificationCode] = useState<string | null>(null)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [currentHousehold, setCurrentHousehold] = useAtom(selectedHouseholdAtom)
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
    defaultValues: {
      secret: currentHousehold?.secret || '',
    },
  })

  const handleCancelSecretEdit = () => {
    setIsEditingSecret(false)
    reset({ secret: currentHousehold?.secret || null })
  }

  const handleSaveSecret = async (data: FormValues) => {
    if (!currentHousehold) {
      console.error('No current household')
      return
    }

    const token = await getToken()
    const url = `${config.apiBaseUrl}/api/households/${currentHousehold.id}/secret`

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ secret: data.secret }),
      })

      const responseData = await response.json().catch(() => ({}))

      if (!response.ok) {
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          response: responseData,
        })
        throw new Error(responseData.error || 'Failed to update secret')
      }

      // @ts-ignore
      setCurrentHousehold({
        ...currentHousehold,
        secret: responseData.secret,
      })

      setIsEditingSecret(false)
    } catch (error) {
      console.error('Error updating household secret:', error)
    }
  }

  const handleGenerateCode = async () => {
    const token = await getToken()
    const url = `${config.apiBaseUrl}/api/verification/generate`

    setIsGeneratingCode(true)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ householdId: currentHousehold!.id }),
      })

      const responseData = await response.json().catch(() => ({}))

      if (!response.ok) {
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          response: responseData,
        })
        throw new Error(responseData.error || 'Failed to generate code')
      }

      setVerificationCode(responseData.code)
    } catch (error) {
      console.error('Error generating code:', error)
    } finally {
      setIsGeneratingCode(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Manage Household</DialogTitle>
          <DialogDescription>Manage your household members and settings.</DialogDescription>
        </DialogHeader>
        {useUserRole().isAdmin && (
          <div className='grid gap-4 py-4'>
            <p className='text-sm text-muted-foreground'>
              Set up your household secret and generate a code to invite members. The code{' '}
              <span className='font-semibold'>expires after 60 minutes</span> and{' '}
              <span className='font-semibold'>is single use</span>.
            </p>
            <div className='grid gap-2'>
              <Label htmlFor='household-name'>Household secret</Label>
              <div className='flex items-center gap-2'>
                <div>
                  <Input
                    {...register('secret')}
                    placeholder='Eg. your pets name, etc.'
                    aria-invalid={errors.secret ? 'true' : 'false'}
                    className={errors.secret ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    disabled={!isEditingSecret}
                  />
                  {errors.secret && (
                    <p className='text-sm text-red-600' role='alert'>
                      {errors.secret.message}
                    </p>
                  )}
                </div>
                {isEditingSecret ? (
                  <>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={handleSubmit(handleSaveSecret)}
                      className='h-8 w-8 p-0'
                      type='button'
                    >
                      <Check className='h-3 w-3' />
                    </Button>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => handleCancelSecretEdit()}
                      className='h-8 w-8 p-0'
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  </>
                ) : (
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => setIsEditingSecret(true)}
                    className='h-8 w-8 p-0'
                  >
                    <Edit2 className='h-3 w-3' />
                  </Button>
                )}
              </div>
            </div>
            <div className='flex items-end gap-2'>
              <Button
                type='button'
                variant='outline'
                className='w-auto'
                disabled={!currentHousehold?.secret || isGeneratingCode}
                onClick={handleGenerateCode}
              >
                {isGeneratingCode ? 'Generating...' : 'Generate code'}
              </Button>
              <Input
                type='text'
                placeholder='Verification code'
                disabled
                value={verificationCode || undefined}
              />
            </div>
          </div>
        )}
        <MemberList />
        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ManageHouseholdModal
