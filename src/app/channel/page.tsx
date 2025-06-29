'use client'

import Topbar from '@/components/Topbar'
import Sidebar from '@/components/Sidebar'
import ChannelsPage from '@/pages/ChannelsPage'

export default function Channel() {
  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <Topbar />
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">
            <ChannelsPage />
        </main>
      </div>
    </div>
  )
}