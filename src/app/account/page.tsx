'use client'

import Topbar from '@/components/Topbar'
import Sidebar from '@/components/Sidebar'
import AccountPage from '@/pages/AccountPage'

export default function Channel() {
  return (
    <div className="layout-wrapper">
      <Topbar />
      <Sidebar />
      <div className="scrollable-content">
        <div className="flex-1">
          <AccountPage />
        </div>
      </div>
    </div>
  )
}