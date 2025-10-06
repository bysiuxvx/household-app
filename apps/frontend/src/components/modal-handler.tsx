import * as React from 'react'

import CreateHouseholdModal from './create-household-modal.tsx'
import ManageHouseholdModal from './manage-household/manage-household-modal.tsx'

interface ModalsProps {
  createHouseholdModalOpen: boolean
  setCreateHouseholdModalOpen: (open: boolean) => void
  manageHouseholdModalOpen: boolean
  setManageHouseholdModalOpen: (open: boolean) => void
}

export const Modals = React.memo(
  ({
    createHouseholdModalOpen,
    setCreateHouseholdModalOpen,
    manageHouseholdModalOpen,
    setManageHouseholdModalOpen,
  }: ModalsProps) => {
    return (
      <>
        <CreateHouseholdModal
          open={createHouseholdModalOpen}
          setOpen={setCreateHouseholdModalOpen}
        />
        {manageHouseholdModalOpen && (
          <ManageHouseholdModal
            open={manageHouseholdModalOpen}
            setOpen={setManageHouseholdModalOpen}
          />
        )}
      </>
    )
  }
)

Modals.displayName = 'Modals'
