import React from 'react'
import Topbar from '@/components/Topbar'
import Sidebar from '@/components/Sidebar'
import DevicesPage from '@/pages/DevicesPage'

export default function Layout() {
  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <Topbar />
      
      <div className="flex min-h-screen">
        <Sidebar />
        
        <main className="flex-1">
          <DevicesPage />
        </main>
      </div>
    </div>
  )
}
