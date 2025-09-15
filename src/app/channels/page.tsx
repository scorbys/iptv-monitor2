'use client'

import Topbar from '@/components/Topbar'
import Sidebar from '@/components/Sidebar'
import ChannelsPage from '@/pages/ChannelsPage'

export default function Channel() {
  return (
    <div className="layout-wrapper">
      <Topbar />
      <Sidebar />
      <div className="scrollable-content">
        <div className="flex-1">
          <ChannelsPage />
        </div>
      </div>
    </div>
  )
}