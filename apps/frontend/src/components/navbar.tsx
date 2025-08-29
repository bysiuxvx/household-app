import { SignOutButton } from '@clerk/clerk-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { ArrowLeft, Menu, Settings, Users } from 'lucide-react'

import { selectedHouseholdAtom } from '../store/store.ts'
import { Button } from './ui/button.tsx'

interface NavbarProps {
  setOpen: (open: boolean) => void
}

function Navbar({ setOpen }: NavbarProps) {
  const [selectedHousehold, setSelectedHousehold] = useAtom(selectedHouseholdAtom)
  const queryClient = useQueryClient()

  const handleBackClick = () => {
    // @ts-ignore
    setSelectedHousehold(null)
    queryClient.invalidateQueries({ queryKey: ['households'] })
  }

  if (!selectedHousehold)
    return (
      <nav className='bg-card border-b border-border p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Button variant='ghost' size='sm'>
              <Menu className='h-5 w-5' />
            </Button>
            <h1 className='text-lg font-semibold text-foreground'>Households</h1>
          </div>
          <SignOutButton>
            <Button variant='ghost' size='sm'>
              Sign Out
            </Button>
          </SignOutButton>
        </div>
      </nav>
    )
  return (
    <nav className='bg-card border-b border-border p-4'>
      <div className='flex items-center gap-3'>
        <Button variant='ghost' size='sm' onClick={handleBackClick} className='gap-1.5 px-2.5'>
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <div className='flex-1'>
          <h1 className='text-lg font-semibold'>{selectedHousehold.name}</h1>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Users className='h-3 w-3' />
            <span>{selectedHousehold?.members?.length} members</span>
          </div>
        </div>
        <Button variant='ghost' size='sm' onClick={() => setOpen(true)}>
          <Settings className='h-4 w-4' />
        </Button>
      </div>
    </nav>
  )
}

export default Navbar
