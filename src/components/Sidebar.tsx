'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import { HomeModernIcon, SignalIcon, TvIcon, WindowIcon } from '@heroicons/react/24/outline'


const Sidebar = () => {
  const pathname = usePathname()

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeModernIcon
    },
    {
      name: 'IPTV',
      href: '/iptv',
      icon: TvIcon
    },
    {
      name: 'Chromecast',
      href: '/chromecast',
      icon: WindowIcon
    },
    {
      name: 'Channel',
      href: '/channel',
      icon: SignalIcon
    }
  ]

  return (
    <div className="w-64 bg-zinc-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex flex-col h-full">
        {/* Header dengan Icon dan Title */}
        <div className="flex items-center gap-3 p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex-shrink-0">
            <HomeModernIcon className="w-8 h-8 text-lime-900" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              IPTV Monitoring
            </h1>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 p-4">
          <NavigationMenu.Root orientation="vertical" className="w-full">
            <NavigationMenu.List className="flex flex-col gap-2 w-full">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <NavigationMenu.Item key={item.name} className="w-full">
                    <Link href={item.href} passHref legacyBehavior>
                      <NavigationMenu.Link asChild>
                        <button
                          className={`
                            w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200
                            ${isActive 
                              ? 'bg-lime-500 text-white shadow-sm' 
                              : 'text-slate-700 dark:text-slate-300 hover:bg-lime-900 hover:text-white'
                            }
                            focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900
                          `}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium">{item.name}</span>
                        </button>
                      </NavigationMenu.Link>
                    </Link>
                  </NavigationMenu.Item>
                )
              })}
            </NavigationMenu.List>
          </NavigationMenu.Root>
        </div>

        {/* Footer atau space kosong */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
            © 2024 IPTV Monitoring
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar