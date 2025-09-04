import { ClerkProvider, SignIn, SignedIn, SignedOut } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import { Toaster } from './components/ui/sonner.tsx'
import './index.css'
import { register } from './serviceWorkerRegistration'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

const queryClient = new QueryClient()

// Only register service worker in production
if (import.meta.env.PROD) {
  register({
    onSuccess: (registration) => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope)
    },
    onUpdate: (registration) => {
      console.log('New content is available; please refresh.')
      // You can add a custom UI to inform the user to update the app
      if (window.confirm('New version available! Update now?')) {
        const waitingServiceWorker = registration.waiting
        if (waitingServiceWorker) {
          waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' })
          window.location.reload()
        }
      }
    },
  })
}

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
          <Toaster position='top-right' />
        </QueryClientProvider>
      </SignedIn>
    </ClerkProvider>
  </StrictMode>
)
