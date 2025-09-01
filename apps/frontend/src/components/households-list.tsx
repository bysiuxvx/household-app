import type { Household, Household as HouseholdType } from '../models/models.ts'
import { HouseholdCard } from './household-card.tsx'

interface HouseholdProps {
  households: Household[]
  setHousehold: (household: Household) => void
}

function HouseholdsList({ households, setHousehold }: HouseholdProps) {
  return (
    <div className='space-y-3 w-full'>
      {households.map((household: HouseholdType) => (
        <div key={household.id} className='w-full'>
          <HouseholdCard household={household} onClick={() => setHousehold(household)} />
        </div>
      ))}
    </div>
  )
}

export default HouseholdsList
