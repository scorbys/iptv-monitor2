'use client'

import React, { useState } from 'react'
import { 
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline"
import { ChevronDownIcon } from "@heroicons/react/20/solid"
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export default function DevicesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')

  // Sample devices data
  const devices = [
    {
      id: 1,
      site: 'Castle Bravo',
      host: 'Network Server',
      uptime: '4:45 PM - 4:45 AM',
      status: 'Offline',
      lastSeen: 'Now'
    },
    {
      id: 2,
      site: 'HOME',
      host: 'Network Server', 
      uptime: '4:45 PM - 4:45 AM',
      status: 'Offline',
      lastSeen: 'Now'
    },
    {
      id: 3,
      site: 'HOME-RDBU',
      host: 'Network Server',
      uptime: '4:45 PM - 4:45 AM', 
      status: 'Offline',
      lastSeen: 'Now'
    },
    {
      id: 4,
      site: 'Office Main',
      host: 'Network Server',
      uptime: '2:30 PM - 2:30 AM',
      status: 'Online',
      lastSeen: '5 min ago'
    },
    {
      id: 5,
      site: 'Datacenter 1',
      host: 'Network Server',
      uptime: '6:00 PM - 6:00 AM',
      status: 'Online',
      lastSeen: '1 min ago'
    },
    {
      id: 6,
      site: 'Branch Office',
      host: 'Network Server',
      uptime: '3:15 PM - 3:15 AM',
      status: 'Offline',
      lastSeen: '2 hours ago'
    }
  ]

  const filteredDevices = devices.filter(device =>
    device.site.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const onlineCount = devices.filter(d => d.status === 'Online').length
  const totalCount = devices.length

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {/* Left - Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-80 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Right - Controls */}
        <div className="flex items-center gap-4">
          {/* Site Group Dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <span className="text-sm text-gray-700">Site Group</span>
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="min-w-48 bg-white rounded-lg shadow-lg border border-gray-200 p-1 z-50">
                <DropdownMenu.Item className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
                  All Sites
                </DropdownMenu.Item>
                <DropdownMenu.Item className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
                  Active Sites
                </DropdownMenu.Item>
                <DropdownMenu.Item className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
                  Offline Sites
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* Device Count */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              All ({totalCount})
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              ({onlineCount})
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              ({totalCount - onlineCount})
            </span>
          </div>

          {/* Info Icon */}
          <InformationCircleIcon className="w-5 h-5 text-gray-400" />

          {/* View Toggle */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Grid view"
              aria-label="Grid view"
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              title="List view"
              aria-label="List view"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Create New Site Button */}
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Create a New Site
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevices.map((device) => (
            <div key={device.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:bg-gray-50 transition-shadow">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {device.site}
                </h3>
                <p className="text-sm text-gray-500">
                  {device.host}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="text-sm text-gray-900">{device.uptime}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Seen</span>
                  <span className="text-sm text-gray-900">{device.lastSeen}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    device.status === 'Online' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                      device.status === 'Online' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    {device.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Host
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uptime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Seen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDevices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {device.site}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {device.host}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {device.uptime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      device.status === 'Online' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                        device.status === 'Online' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      {device.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {device.lastSeen}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
