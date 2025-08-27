import { SignOutButton } from '@clerk/clerk-react';
import { useAtom } from 'jotai';
import { Menu } from 'lucide-react';
import { Button } from './ui/button.tsx'
import { selectedHouseholdAtom } from '../store'

function Navbar() {
  const [selectedHousehold, setSelectedHousehold] = useAtom(selectedHouseholdAtom);

  if (!selectedHousehold) return (
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
  )
}

export default Navbar
