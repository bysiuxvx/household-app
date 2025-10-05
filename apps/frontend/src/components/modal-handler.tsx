import * as React from 'react'

import type { Household as HouseholdType } from '../models/models'
import CreateHouseholdModal from './create-household-modal.tsx'
import ManageHouseholdModal from './manage-household/manage-household-modal.tsx'

interface ModalsProps {
  createHouseholdModalOpen: boolean
  setCreateHouseholdModalOpen: (open: boolean) => void
  manageHouseholdModalOpen: boolean
  setManageHouseholdModalOpen: (open: boolean) => void
  setSelectedHousehold: (household: HouseholdType | null) => void
}

export const Modals = React.memo(
  ({
    createHouseholdModalOpen,
    setCreateHouseholdModalOpen,
    manageHouseholdModalOpen,
    setManageHouseholdModalOpen,
    setSelectedHousehold,
  }: ModalsProps) => {
    return (
      <>
        <CreateHouseholdModal
          open={createHouseholdModalOpen}
          setOpen={setCreateHouseholdModalOpen}
        />
        <ManageHouseholdModal
          open={manageHouseholdModalOpen}
          setOpen={setManageHouseholdModalOpen}
          setCurrentHousehold={setSelectedHousehold}
        />
      </>
    )
  }
)

Modals.displayName = 'Modals'
