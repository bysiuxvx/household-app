import { useTheme } from 'next-themes'
import * as React from 'react'
import { Toaster as Sonner } from 'sonner'

import { useDeviceType } from '../../hooks/use-device-type.ts'

type ToasterProps = React.ComponentProps<typeof Sonner>

const getPosition = (deviceType: string) =>
  deviceType === 'mobile' ? 'bottom-center' : 'top-right'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()
  const deviceType = useDeviceType()
  const position = getPosition(deviceType)

  return (
    <Sonner
      position={position}
      theme={theme as ToasterProps['theme']}
      className='toaster group'
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
