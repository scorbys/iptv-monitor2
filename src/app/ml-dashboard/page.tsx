'use client'

import Topbar from '@/components/Topbar'
import Sidebar from '@/components/Sidebar'
import MLDashboardPage from '@/pages/MLDashboardPage'

export default function MLDashboard() {
  return (
    <div className="layout-wrapper">
      <Topbar />
      <Sidebar />
      <div className="scrollable-content">
        <div className="flex-1">
          <MLDashboardPage />
        </div>
      </div>
    </div>
  )
}
