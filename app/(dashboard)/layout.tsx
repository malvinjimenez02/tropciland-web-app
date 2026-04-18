import type { ReactNode } from 'react'
import SidebarWrapper from './_components/SidebarWrapper'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: '#F9FAFB', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <SidebarWrapper />

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
