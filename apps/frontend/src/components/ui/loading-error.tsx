import { AlertCircle, RefreshCw } from 'lucide-react'
import * as React from 'react'

import { Button } from './button.tsx'

interface LoadingErrorProps {
  refetchFn: () => void
  description: string
}

function LoadingError({ refetchFn, description }: LoadingErrorProps) {
  return (
    <div className='flex flex-col items-center justify-center h-64 space-y-4 p-4 text-center'>
      <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30'>
        <AlertCircle className='w-8 h-8 text-red-600 dark:text-red-400' />
      </div>
      <div className='space-y-2'>
        <h3 className='text-lg font-medium text-foreground'>Something went wrong</h3>
        <p className='text-muted-foreground max-w-md'>{description}</p>
        <Button variant='outline' className='mt-4' onClick={() => refetchFn()}>
          <RefreshCw className='mr-2 h-4 w-4' />
          Try again
        </Button>
      </div>
    </div>
  )
}

export default LoadingError
