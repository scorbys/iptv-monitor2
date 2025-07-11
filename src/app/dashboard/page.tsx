'use client'

import Topbar from '@/components/Topbar'
import Sidebar from '@/components/Sidebar'
import DevicesPage from '@/pages/DevicesPage'

export default function Dashboard() {
  return (
    <div className="layout-wrapper">
      <Topbar />
      <Sidebar />
      <div className="scrollable-content">
        <div className="flex-1">
          <DevicesPage />
        </div>
      </div>
    </div>
  )
}