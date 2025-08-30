import { useAtom } from 'jotai'
import { MoreVertical } from 'lucide-react'

import { selectedHouseholdAtom, useUserRole } from '../../store/store.ts'
import { Button } from '../ui/button.tsx'
import { Label } from '../ui/label.tsx'
import { Table, TableRow } from '../ui/table.tsx'

function MemberList() {
  const [currentHousehold, setCurrentHousehold] = useAtom(selectedHouseholdAtom)
  const { isAdmin } = useUserRole()

  return (
    <div className='grid gap-4 py-4'>
      <Label htmlFor='household-name'>Household members</Label>
      <Table>
        {currentHousehold?.members?.map((member) => (
          <TableRow key={member.user.id}>
            <div key={member.user.id} className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center border-2 border-background'>
                  {(member.user.username || member.user.email).charAt(0).toUpperCase()}
                </div>
                <span className='font-medium'>{member.user.username || member.user.email}</span>
              </div>
              {isAdmin && (
                <div className='flex items-center gap-2'>
                  <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                    <MoreVertical className='h-4 w-4' />
                  </Button>
                </div>
              )}
            </div>
          </TableRow>
        ))}
      </Table>
    </div>
  )
}

export default MemberList
