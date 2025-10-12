import { useEffect, useState } from 'react'

export function useDeviceType() {
  const getDeviceType = () => {
    const isMobile = window.matchMedia('(max-width: 767px)').matches
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isMobile && hasTouch) return 'mobile'
    return 'desktop'
  }

  const [deviceType, setDeviceType] = useState(getDeviceType)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const handleChange = () => setDeviceType(getDeviceType())
    mediaQuery.addEventListener('change', handleChange)
    window.addEventListener('resize', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
      window.removeEventListener('resize', handleChange)
    }
  }, [])

  return deviceType
}
