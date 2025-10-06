import { useAtom } from 'jotai'
import { MoreVertical } from 'lucide-react'

import { useUserRole } from '../../hooks/user-role.ts'
import type { HouseholdMember } from '../../models/models.ts'
import { selectedHouseholdAtom } from '../../store/store.ts'
import { Badge } from '../ui/badge.tsx'
import { Button } from '../ui/button.tsx'
import { Label } from '../ui/label.tsx'
import { Table, TableBody, TableRow } from '../ui/table.tsx'

function MemberList() {
  const [currentHousehold, setCurrentHousehold] = useAtom(selectedHouseholdAtom)
  const { isAdmin } = useUserRole()

  const sortedMembers: HouseholdMember[] = currentHousehold?.members?.sort((a, b) => {
    if (a.role === 'ADMIN') return -1
    if (b.role === 'ADMIN') return 1
    return 0
  })

  return (
    <div className='grid gap-4 py-4'>
      <Label htmlFor='household-name'>Household members</Label>
      <Table>
        <TableBody>
          {sortedMembers?.map((member) => (
            <TableRow key={member.user.id}>
              <td className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center border-2 border-background'>
                      {(member.user.username || member.user.email).charAt(0).toUpperCase()}
                    </div>
                    <span className='font-medium'>{member.user.username || member.user.email}</span>
                  </div>
                  <div className='flex justify-end gap-2'>
                    <Badge variant='secondary'>{member.role}</Badge>
                    {isAdmin && (
                      <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                        <MoreVertical className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                </div>
              </td>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default MemberList
