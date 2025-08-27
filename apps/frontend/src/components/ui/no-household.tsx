import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card.tsx'
import { Users } from 'lucide-react';

function NoHousehold() {

  return (
    <Card className="border-dashed border-2 border-border">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <CardTitle className="text-lg mb-2">No households yet</CardTitle>
        <CardDescription className="mb-4 max-w-sm">
          Create your first household to start managing tasks and grocery lists with your family
        </CardDescription>
      </CardContent>
    </Card>
  )
}

export default NoHousehold
