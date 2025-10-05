import { Separator } from './separator.tsx'

function WelcomeBanner({ user }) {
  return (
    <>
      <div className='text-center py-6'>
        <h2 className='text-xl font-semibold text-foreground mb-2'>
          Welcome back, {user?.firstName || user?.username || 'friend'}!
        </h2>
        <p className='text-muted-foreground'>Manage your household tasks and lists</p>
      </div>
      <Separator className='my-4' />
    </>
  )
}

export default WelcomeBanner
