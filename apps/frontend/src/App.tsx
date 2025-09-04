import { useAuth, useUser } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { Loader, Plus } from 'lucide-react'
import { useState } from 'react'
import * as React from 'react'

import CreateHouseholdModal from './components/create-household-modal.tsx'
import Household from './components/household.tsx'
import HouseholdsList from './components/households-list.tsx'
import ManageHouseholdModal from './components/manage-household/manage-household-modal.tsx'
import Navbar from './components/navbar.tsx'
import { ThemeProvider } from './components/theme-provider'
import { Button } from './components/ui/button.tsx'
import NoHouseholds from './components/ui/no-household.tsx'
import { Separator } from './components/ui/separator.tsx'
import { useLoadingTime } from './hooks/use-loading-time.ts'
import type { Household as HouseholdType } from './models/models.ts'
import { selectedHouseholdAtom } from './store/store.ts'
import { loadHouseholds } from './utils/query-functions.ts'

const LOADING_THRESHOLD = 2000

function App() {
  const [createHouseholdModalOpen, setCreateHouseholdModalOpen] = useState<boolean>(false)
  const [manageHouseholdModalOpen, setManageHouseholdModalOpen] = useState<boolean>(false)
  const { getToken } = useAuth()
  const { user } = useUser()

  const [selectedHousehold, setSelectedHousehold] = useAtom(selectedHouseholdAtom)

  const {
    data: households = [],
    isLoading,
    error,
  } = useQuery<HouseholdType[]>({
    queryKey: ['households'],
    queryFn: () => loadHouseholds(getToken),
  })

  const loadingTime: number = useLoadingTime(isLoading)

  return (
    <div className='min-h-screen bg-background pb-20 dark:bg-[#1b1b1c]'>
      <ThemeProvider defaultTheme='system' storageKey='household-app-theme'>
        <Navbar setOpen={setManageHouseholdModalOpen} />
        {createHouseholdModalOpen && (
          <CreateHouseholdModal
            open={createHouseholdModalOpen}
            setOpen={setCreateHouseholdModalOpen}
          />
        )}
        {manageHouseholdModalOpen && (
          <ManageHouseholdModal
            open={manageHouseholdModalOpen}
            setOpen={setManageHouseholdModalOpen}
            setCurrentHousehold={setSelectedHousehold}
          />
        )}

        <main className='p-4 space-y-6'>
          {!selectedHousehold && (
            <>
              <div className='text-center py-6'>
                <h2 className='text-xl font-semibold text-foreground mb-2'>
                  Welcome back, {user?.firstName || user?.username || 'friend'}!
                </h2>
                <p className='text-muted-foreground'>Manage your household tasks and lists</p>
              </div>
              <Separator className='my-4' />
            </>
          )}

          {!selectedHousehold ? (
            isLoading ? (
              <div className='flex flex-col items-center justify-center h-64 space-y-4'>
                <Loader className='animate-spin h-12 w-12' />
                {loadingTime > LOADING_THRESHOLD && (
                  <p className='text-muted-foreground'>
                    Loading... This takes longer than expected
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-medium text-foreground'>Your Households</h3>
                    <Button
                      size='sm'
                      className='gap-2'
                      onClick={() => setCreateHouseholdModalOpen(true)}
                    >
                      <Plus className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
                <div className='space-y-4 w-full'>
                  <div className='w-full'>
                    {households.length > 0 ? (
                      <HouseholdsList households={households} setHousehold={setSelectedHousehold} />
                    ) : (
                      <NoHouseholds />
                    )}
                  </div>
                </div>
              </>
            )
          ) : (
            <Household />
          )}
        </main>
      </ThemeProvider>
    </div>
  )
}

export default App
