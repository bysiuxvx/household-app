import { SignOutButton } from '@clerk/clerk-react'
import { Button } from "@/components/ui/button"
import { Plus, Menu } from "lucide-react"
import { HouseholdCard } from '@/components/household-card.tsx'
import NoHousehold from '@/components/ui/no-household.tsx'

function App() {

  const households: any[] = []
  const user: any = null

  return (
    <div className="min-h-screen bg-background pb-20">
      <nav className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Households</h1>
          </div>
          <SignOutButton>
            <Button variant="ghost" size='sm'>
              Sign Out
            </Button>
          </SignOutButton>
        </div>
      </nav>

      <main className="p-4 space-y-6">
        <div className="text-center py-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">Welcome back, {user?.firstName || "there"}!</h2>
          <p className="text-muted-foreground">Manage your household tasks and lists</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-foreground">Your Households</h3>
            <Button size="sm" className="gap-2"
            onClick={() => {

            }}
            >
              <Plus className="h-4 w-4" />
              Create
            </Button >
          </div>
        </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">

          {/* Households List */}
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
