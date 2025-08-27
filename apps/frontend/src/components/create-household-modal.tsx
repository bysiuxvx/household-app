import { useState } from 'react';
import { HOUSEHOLD_MIN_NAME_LENGTH } from '@household/shared/types/household-model';
import { Button } from './ui/button.tsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.tsx'
import { Input } from './ui/input.tsx';
import { Label } from './ui/label.tsx';

interface ModalProps {
  open: boolean,
  setOpen: (open: boolean) => void
}

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
}

function CreateHouseholdModal({ open, setOpen }: ModalProps) {
  const [name, setName] = useState<string>('')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Household</DialogTitle>
            <DialogDescription>
              Give your household a name to get started with shared tasks and lists.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="household-name">Household Name</Label>
              <Input
                id="household-name"
                placeholder="e.g., Smith Family, Roommates, etc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit"
                    disabled={name.trim().length < HOUSEHOLD_MIN_NAME_LENGTH}
            >
              Create Household
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateHouseholdModal
