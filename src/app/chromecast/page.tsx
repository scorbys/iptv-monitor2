'use client'

import Topbar from '@/components/Topbar'
import Sidebar from '@/components/Sidebar'
import ChromecastPage from '@/pages/ChromecastPage'

export default function Chromecast() {
  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <Topbar />
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1">
          <ChromecastPage />
        </main>
      </div>
    </div>
  )
}