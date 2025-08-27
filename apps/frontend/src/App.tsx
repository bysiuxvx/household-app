
import { useUser } from "@clerk/clerk-react";
import { useState } from 'react'
import Navbar from './components/navbar.tsx'
import CreateHouseholdModal from './components/create-household-modal.tsx'
import { Button } from './components/ui/button.tsx'
import { Plus } from 'lucide-react'
import { HouseholdCard } from './components/household-card.tsx'
import NoHousehold from './components/ui/no-household.tsx'


function App() {

  const [createHouseholdModalOpen, setCreateHouseholdModalOpen] = useState<boolean>(false)
  const households: any[] = []
  const { user } = useUser()

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar/>
      {createHouseholdModalOpen && <CreateHouseholdModal open={createHouseholdModalOpen} setOpen={setCreateHouseholdModalOpen}/>}

      <main className="p-4 space-y-6">
        <div className="text-center py-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Welcome back, {user?.firstName || user?.username || "there"}!</h2>
          <p className="text-muted-foreground">Manage your household tasks and lists</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-foreground">Your Households</h3>
            <Button size="sm" className="gap-2"
            onClick={() => setCreateHouseholdModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create
            </Button >
          </div>
        </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">

          {households.length > 0 ? (
            <div className="space-y-3">
              {households.map((household) => (
                <HouseholdCard
                  key={household.id}
                  household={household}
                  // onClick={() => handleHouseholdClick(household.id)}
                  onClick={() => null}
                />
              ))}
            </div>
          ) : (
            <NoHousehold/>
          )}
        </div>
        </div>
      </main>

    </div>
  )
}

export default App
