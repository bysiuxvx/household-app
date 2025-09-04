import { useEffect, useState } from 'react'

export function useLoadingTime(isLoading: boolean) {
  const [fetchingForMs, setFetchingForMs] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      setFetchingForMs(0)
      return
    }

    const start = Date.now()
    const interval = setInterval(() => {
      if (!isLoading) {
        clearInterval(interval)
        return
      }
      setFetchingForMs(Date.now() - start)
    }, 100)

    return () => clearInterval(interval)
  }, [isLoading])

  return fetchingForMs
}
