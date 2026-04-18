'use client'

import { useState } from 'react'
import SidebarNav from './sidebar-nav'

export default function SidebarWrapper() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className="flex flex-col shrink-0 border-r"
      style={{
        width: collapsed ? '56px' : '220px',
        backgroundColor: '#ffffff',
        borderColor: '#E5E7EB',
        transition: 'width 200ms ease',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center border-b shrink-0"
        style={{
          height: '56px',
          borderColor: '#E5E7EB',
          padding: collapsed ? '0 12px' : '0 12px 0 20px',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#1C5E4A' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-gray-900 truncate">Mi Tienda</span>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            title="Colapsar menú"
            className="rounded-md p-1 text-gray-400 transition-colors"
            style={{ flexShrink: 0 }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F3F4F6'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#374151'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
      </div>

      {/* Expand button (only when collapsed) */}
      {collapsed && (
        <div className="px-2 pt-2">
          <button
            onClick={() => setCollapsed(false)}
            title="Expandir menú"
            className="w-full flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F3F4F6'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#374151'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}

      <SidebarNav collapsed={collapsed} />
    </aside>
  )
}
