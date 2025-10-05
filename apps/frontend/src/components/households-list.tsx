import type { Household, Household as HouseholdType } from '../models/models.ts'
import { HouseholdCard } from './household-card.tsx'
import NoHouseholds from './ui/no-household.tsx'

interface HouseholdProps {
  households: Household[]
  setHousehold: (household: Household) => void
}

function HouseholdsList({ households, setHousehold }: HouseholdProps) {
  return (
    <div className='space-y-4 w-full'>
      <div className='w-full'>
        <div className='space-y-3 w-full'>
          {!households.length ? (
            <NoHouseholds />
          ) : (
            households.map((household: HouseholdType) => (
              <div key={household.id} className='w-full'>
                <HouseholdCard household={household} onClick={() => setHousehold(household)} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default HouseholdsList
