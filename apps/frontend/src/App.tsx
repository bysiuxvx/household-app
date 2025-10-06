import { useAuth, useUser } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { useState } from 'react'
import * as React from 'react'

import Household from './components/household.tsx'
import HouseholdsList from './components/households-list.tsx'
import { Modals } from './components/modal-handler.tsx'
import Navbar from './components/navbar.tsx'
import { ThemeProvider } from './components/theme-provider'
import HouseholdHeader from './components/ui/household-header.tsx'
import LoadingState from './components/ui/loading-state.tsx'
import WelcomeBanner from './components/ui/welcome-banner.tsx'
import { useLoadingTime } from './hooks/use-loading-time.ts'
import type { Household as HouseholdType } from './models/models.ts'
import { selectedHouseholdAtom } from './store/store.ts'
import { loadHouseholds } from './utils/query-functions.ts'

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

  const renderContent = () => {
    if (selectedHousehold) {
      return <Household />
    }

    if (isLoading) {
      return <LoadingState loadingTime={loadingTime} />
    }

    return (
      <>
        <HouseholdHeader onCreateHousehold={() => setCreateHouseholdModalOpen(true)} />
        <HouseholdsList households={households} setHousehold={setSelectedHousehold} />
      </>
    )
  }

  return (
    <div className='min-h-screen bg-slate-100/50 pb-20 dark:bg-[#1b1b1c]'>
      <ThemeProvider defaultTheme='system' storageKey='household-app-theme'>
        <Navbar setOpen={setManageHouseholdModalOpen} />
        <div className='mx-auto max-w-full md:max-w-[1250px] px-4'>
          <Modals
            createHouseholdModalOpen={createHouseholdModalOpen}
            setCreateHouseholdModalOpen={setCreateHouseholdModalOpen}
            manageHouseholdModalOpen={manageHouseholdModalOpen}
            setManageHouseholdModalOpen={setManageHouseholdModalOpen}
            setSelectedHousehold={setSelectedHousehold}
          />

          <main className='space-y-6 pt-4'>
            {!selectedHousehold && <WelcomeBanner user={user} />}
            {renderContent()}
          </main>
        </div>
      </ThemeProvider>
    </div>
  )
}

export default App
