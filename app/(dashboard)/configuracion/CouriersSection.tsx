'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Courier } from '@/lib/types'
import { toggleCourierActiveAction, createCourierAction } from './actions'

type Props = { initialCouriers: Courier[] }

export default function CouriersSection({ initialCouriers }: Props) {
  const router = useRouter()
  const [couriers, setCouriers] = useState(initialCouriers)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'mensajero_sd' | 'transportadora'>('mensajero_sd')
  const [adding, setAdding] = useState(false)

  // Sync when server re-renders with fresh data
  useEffect(() => { setCouriers(initialCouriers) }, [initialCouriers])

  async function handleToggle(id: string, current: boolean) {
    // Optimistic
    setCouriers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !current } : c))
    )
    try {
      await toggleCourierActiveAction(id, !current)
    } catch {
      // Revert
      setCouriers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, active: current } : c))
      )
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    try {
      await createCourierAction({ name: newName.trim(), type: newType })
      setNewName('')
      router.refresh()
    } finally {
      setAdding(false)
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Mensajeros y transportadoras</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {couriers.filter((c) => c.active).length} activos de {couriers.length}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-5 py-2.5 text-xs font-medium text-gray-500">Nombre</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Tipo</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Estado</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {couriers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-xs text-gray-400">
                  Sin couriers registrados. Agrega uno abajo.
                </td>
              </tr>
            ) : (
              couriers.map((courier) => (
                <tr key={courier.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{courier.name}</td>
                  <td className="px-4 py-3">
                    <TypeBadge type={courier.type} />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium ${
                        courier.active ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {courier.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Toggle
                      active={courier.active}
                      onToggle={() => handleToggle(courier.id, courier.active)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="px-5 py-4 border-t border-gray-100 flex flex-col gap-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Agregar nuevo</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre"
            required
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1C5E4A]"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as 'mensajero_sd' | 'transportadora')}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#1C5E4A]"
          >
            <option value="mensajero_sd">Mensajero SD</option>
            <option value="transportadora">Transportadora</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="self-end px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors" style={{ backgroundColor: '#1C5E4A' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#174d3c')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1C5E4A')}
        >
          {adding ? 'Agregando…' : 'Agregar'}
        </button>
      </form>
    </section>
  )
}

// ─── Sub-components ────────────────────────────────────────────

function TypeBadge({ type }: { type: Courier['type'] }) {
  return type === 'mensajero_sd' ? (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
      Mensajero SD
    </span>
  ) : (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#E6F2EE] text-[#1C5E4A]">
      Transportadora
    </span>
  )
}

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${
        active ? 'bg-green-500' : 'bg-gray-200'
      }`}
      aria-label={active ? 'Desactivar' : 'Activar'}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          active ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
