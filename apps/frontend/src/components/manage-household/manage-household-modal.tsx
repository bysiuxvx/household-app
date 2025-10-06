import { useAuth } from '@clerk/clerk-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { AlertTriangle, Check, Edit2, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { HOUSEHOLD_MIN_SECRET_LENGTH } from '@household/shared'

import config from '../../config.ts'
import { useUserRole } from '../../hooks/user-role.ts'
import { selectedHouseholdAtom } from '../../store/store.ts'
import { getHeaders } from '../../utils/get-headers.ts'
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
  const [verificationCode, setVerificationCode] = useState<string | undefined>(undefined)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [currentHousehold, setCurrentHousehold] = useAtom(selectedHouseholdAtom)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const { getToken } = useAuth()
  const queryClient = useQueryClient()

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

  const handleLeaveHousehold = () => {
    setShowConfirmDialog(true)
  }

  const confirmLeaveHousehold = async () => {
    if (!currentHousehold) return

    setIsLeaving(true)
    const token = await getToken()
    const url = `${config.apiBaseUrl}/api/households/${currentHousehold.id}/members/me`

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getHeaders(token),
      })

      if (!response.ok) {
        throw new Error('Failed to leave household')
      }

      await queryClient.invalidateQueries({ queryKey: ['households'] })
      setOpen(false)
      setShowConfirmDialog(false)
    } catch (error) {
      console.error('Error leaving household:', error)
    } finally {
      setIsLeaving(false)
      // @ts-ignore
      setCurrentHousehold(null)
    }
  }

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
        headers: getHeaders(token),
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
        headers: getHeaders(token),
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

  const copyCodeToClipboard = () => {
    if (!verificationCode) return
    navigator.clipboard.writeText(verificationCode)
    toast.info('Copied to clipboard')
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
                      <Check className='h-4 w-4' />
                    </Button>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => handleCancelSecretEdit()}
                      className='h-8 w-8 p-0'
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </>
                ) : (
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => setIsEditingSecret(true)}
                    className='h-8 w-8 p-0'
                  >
                    <Edit2 className='h-4 w-4' />
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
                onClick={verificationCode ? copyCodeToClipboard : handleGenerateCode}
              >
                {/*{isGeneratingCode ? 'Generating...' : 'Generate code'}*/}
                {isGeneratingCode
                  ? 'Generating...'
                  : verificationCode
                    ? 'Copy code'
                    : 'Generate code'}
              </Button>
              <Input
                type='text'
                placeholder='Verification code'
                disabled
                value={verificationCode}
              />
            </div>
          </div>
        )}
        <MemberList />
        <DialogFooter>
          <Button
            type='button'
            variant='destructive'
            onClick={handleLeaveHousehold}
            disabled={isLeaving}
          >
            {isLeaving ? 'Leaving...' : 'Leave household'}
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={isLeaving}
          >
            Cancel
          </Button>
        </DialogFooter>

        {/* confirmation modal */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <div className='flex items-center gap-2'>
                <AlertTriangle className='h-5 w-5 text-destructive' />
                <DialogTitle>Leave Household</DialogTitle>
              </div>
              <DialogDescription>
                Are you sure you want to leave the household "{currentHousehold?.name}"? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setShowConfirmDialog(false)}
                disabled={isLeaving}
              >
                Cancel
              </Button>
              <Button variant='destructive' onClick={confirmLeaveHousehold} disabled={isLeaving}>
                {isLeaving ? 'Leaving...' : 'Leave Household'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}

export default ManageHouseholdModal
