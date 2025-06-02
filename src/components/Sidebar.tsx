'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as Tooltip from '@radix-ui/react-tooltip'
import { ArchiveBoxIcon, SignalIcon, TvIcon, WindowIcon } from '@heroicons/react/24/outline'

const Sidebar = () => {
  const pathname = usePathname()

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: ArchiveBoxIcon },
    // { name: 'Devices', href: '/devices', icon: DeviceTabletIcon },
    { name: 'TV Hospitality', href: '/hospitality', icon: TvIcon },
    { name: 'Chromecast', href: '/chromecast', icon: WindowIcon },
    { name: 'Channel', href: '/channel', icon: SignalIcon },
  ]

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="w-12 bg-sky-500 border-r border-gray-200 flex flex-col">
        {/* Navigation Menu */}
        <div className="flex flex-col py-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Tooltip.Root key={item.name}>
                <Tooltip.Trigger asChild>
                  <Link 
                    href={item.href}
                    className={`
                      flex items-center justify-center w-12 h-12 transition-colors rounded-lg
                      ${isActive 
                        ? 'text-zinc-800 bg-inherit' 
                        : 'text-white hover:text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                </Tooltip.Trigger>
                
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="right"
                    sideOffset={8}
                    className="px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg z-50"
                  >
                    {item.name}
                    <Tooltip.Arrow className="fill-gray-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            )
          })}
        </div>
      </div>
    </Tooltip.Provider>
  )
}

export default Sidebar