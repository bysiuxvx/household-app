import { ClerkProvider, SignIn, SignedIn, SignedOut } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <SignedOut>
        <div className='min-h-screen flex items-center justify-center p-4'>
          <SignIn />
        </div>
      </SignedOut>
      <SignedIn>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </SignedIn>
    </ClerkProvider>
  </StrictMode>
)
