import { Plus } from 'lucide-react'

import { Button } from './button.tsx'

interface HouseholdHeaderProps {
  onCreateHousehold: () => void
}

function HouseholdHeader({ onCreateHousehold }: HouseholdHeaderProps) {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-medium text-foreground'>Your Households</h3>
        <Button size='sm' className='gap-2' onClick={onCreateHousehold}>
          <Plus className='h-4 w-4' />
        </Button>
      </div>
    </div>
  )
}

export default HouseholdHeader
