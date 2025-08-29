import { useAuth, useUser } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import CreateHouseholdModal from './components/create-household-modal.tsx'
import { HouseholdCard } from './components/household-card.tsx'
import Household from './components/household.tsx'
import ManageHouseholdModal from './components/manage-household-modal.tsx'
import Navbar from './components/navbar.tsx'
import { Button } from './components/ui/button.tsx'
import NoHousehold from './components/ui/no-household.tsx'
import config from './config'
import { selectedHouseholdAtom } from './store/store.ts'

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
  } = useQuery({
    queryKey: ['households'],
    queryFn: async () => {
      const token = await getToken()
      const response = await fetch(`${config.apiBaseUrl}/api/households`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch households')
      }

      return response.json()
    },
  })

  return (
    <div className='min-h-screen bg-background pb-20'>
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
                  <div className='space-y-3 w-full'>
                    {households.map((household) => (
                      <div key={household.id} className='w-full'>
                        <HouseholdCard
                          household={household}
                          onClick={() => setSelectedHousehold(household)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <NoHousehold />
                )}
              </div>
            </div>
          </>
        )}
        {selectedHousehold && <Household />}
      </main>
    </div>
  )
}

export default App
