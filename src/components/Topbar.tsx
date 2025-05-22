'use client'

import React from 'react'
import Link from 'next/link'
import { BellIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { AvatarIcon, GearIcon, ExitIcon } from "@radix-ui/react-icons"
import { Button } from "@radix-ui/themes"
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export default function Topbar() {
  return (
    <header className="flex items-center justify-between h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 transition-colors">
      {/* Search Section */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm transition-all"
          />
        </div>
      </div>

      {/* Right Section - Notifications & Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Button */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="2"
            className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <BellIcon className="w-5 h-5" />
            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
        </div>

        {/* Profile Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 shadow-sm">
                <AvatarIcon className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Admin User
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  admin@company.com
                </p>
              </div>
              <svg 
                className="w-4 h-4 text-slate-400 transition-transform ui-open:rotate-180" 
                fill="none" 
                viewBox="0 0 20 20"
              >
                <path 
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.084l3.71-3.855a.75.75 0 0 1 1.08 1.04l-4.24 4.4a.75.75 0 0 1-1.08 0l-4.24-4.4a.75.75 0 0 1 .02-1.06z" 
                  fill="currentColor"
                />
              </svg>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-1 z-50"
              sideOffset={8}
              align="end"
            >
              {/* Profile Info Header */}
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Admin User
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  admin@company.com
                </p>
              </div>

              {/* Menu Items */}
              <DropdownMenu.Item asChild>
                <Link 
                  href="/settings"
                  className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md cursor-pointer transition-colors focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-700"
                >
                  <GearIcon className="w-4 h-4" />
                  Settings
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-slate-200 dark:bg-slate-600 my-1" />

              <DropdownMenu.Item asChild>
                <button
                  onClick={() => {
                    // Handle sign out logic here
                    console.log('Sign out clicked')
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md cursor-pointer transition-colors focus:outline-none focus:bg-red-50 dark:focus:bg-red-900/20"
                >
                  <ExitIcon className="w-4 h-4" />
                  Sign Out
                </button>
              </DropdownMenu.Item>

              <DropdownMenu.Arrow className="fill-white dark:fill-slate-800" />
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}
