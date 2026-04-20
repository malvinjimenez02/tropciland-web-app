'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/lib/types'
import { createProductAction, updateProductAction, deleteProductAction } from './actions'

type Props = { initialProducts: Product[] }

const fmt = (n: number) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 2 }).format(n)

export default function ProductsSection({ initialProducts }: Props) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newStock, setNewStock] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editStock, setEditStock] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => { setProducts(initialProducts) }, [initialProducts])

  function startEdit(p: Product) {
    setEditingId(p.id)
    setEditName(p.name)
    setEditPrice(String(p.unit_price))
    setEditStock(String(p.initial_stock))
  }

  function cancelEdit() { setEditingId(null) }

  async function handleSave(id: string) {
    if (!editName.trim()) return
    setSavingId(id)
    const data = { name: editName.trim(), unit_price: parseFloat(editPrice) || 0, initial_stock: parseInt(editStock) || 0 }
    try {
      await updateProductAction(id, data)
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...data } : p))
      setEditingId(null)
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    setDeletingId(id)
    try {
      await deleteProductAction(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    try {
      await createProductAction({
        name: newName.trim(),
        unit_price: parseFloat(newPrice) || 0,
        initial_stock: parseInt(newStock) || 0,
      })
      setNewName(''); setNewPrice(''); setNewStock('')
      router.refresh()
    } finally {
      setAdding(false)
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">Productos e inventario</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {products.length} producto{products.length !== 1 ? 's' : ''} registrado{products.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-5 py-2.5 text-xs font-medium text-gray-500">Nombre</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Precio unit.</th>
              <th className="px-4 py-2.5 text-xs font-medium text-gray-500">Stock inicial</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-xs text-gray-400">
                  Sin productos registrados. Agrega uno abajo.
                </td>
              </tr>
            ) : (
              products.map((p) =>
                editingId === p.id ? (
                  <tr key={p.id} className="bg-gray-50">
                    <td className="px-5 py-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-[#1C5E4A]"
                        placeholder="Nombre"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        min="0"
                        step="0.01"
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-28 focus:outline-none focus:ring-2 focus:ring-[#1C5E4A]"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={editStock}
                        onChange={(e) => setEditStock(e.target.value)}
                        min="0"
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-24 focus:outline-none focus:ring-2 focus:ring-[#1C5E4A]"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleSave(p.id)}
                          disabled={savingId === p.id || !editName.trim()}
                          className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-50 transition-colors"
                          style={{ backgroundColor: '#1C5E4A' }}
                        >
                          {savingId === p.id ? 'Guardando…' : 'Guardar'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(p.unit_price)}</td>
                    <td className="px-4 py-3 text-gray-600">{p.initial_stock.toLocaleString('es-DO')}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          title="Editar"
                          className="p-1.5 text-gray-400 hover:text-[#1C5E4A] hover:bg-[#E6F2EE] rounded-lg transition-colors"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          title="Eliminar"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleAdd} className="px-5 py-4 border-t border-gray-100 flex flex-col gap-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Agregar nuevo</p>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre del producto"
            required
            className="flex-1 min-w-32 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1C5E4A]"
          />
          <input
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="Precio unit. (RD$)"
            min="0"
            step="0.01"
            className="w-40 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1C5E4A]"
          />
          <input
            type="number"
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            placeholder="Stock inicial"
            min="0"
            className="w-32 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1C5E4A]"
          />
        </div>
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="self-end px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 transition-colors"
          style={{ backgroundColor: '#1C5E4A' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#174d3c')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1C5E4A')}
        >
          {adding ? 'Agregando…' : 'Agregar'}
        </button>
      </form>
    </section>
  )
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
