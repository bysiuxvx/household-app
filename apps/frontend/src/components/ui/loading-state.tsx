import { Loader } from 'lucide-react'
import * as React from 'react'

interface LoadingStateProps {
  loadingTime: number
}

function LoadingState({ loadingTime }: LoadingStateProps) {
  const LOADING_THRESHOLD = 2000

  return (
    <div className='flex flex-col items-center justify-center h-64 space-y-4'>
      <Loader className='animate-spin h-12 w-12' />
      {loadingTime > LOADING_THRESHOLD && (
        <p className='text-muted-foreground'>Loading... This takes longer than expected</p>
      )}
    </div>
  )
}

export default LoadingState
