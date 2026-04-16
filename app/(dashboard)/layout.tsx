import type { ReactNode } from 'react'
import SidebarNav from './_components/sidebar-nav'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: '#F9FAFB', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Sidebar */}
      <aside
        className="flex flex-col shrink-0 border-r"
        style={{ width: '220px', backgroundColor: '#ffffff', borderColor: '#E5E7EB' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-14 border-b" style={{ borderColor: '#E5E7EB' }}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#4F46E5' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-900">Mi Tienda</span>
        </div>

        {/* Nav links + sign out */}
        <SidebarNav />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
