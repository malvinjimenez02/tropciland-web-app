'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { OrderSummary, OrderStatus } from '@/lib/types'
import { updateOrderStatusAction, importOrdersFromCsvAction } from './actions'
import type { CsvOrderRow } from './actions'
import OrderPanel from './OrderPanel'

// ─── Column config ─────────────────────────────────────────────

type ColumnConfig = {
  id: string
  label: string
  color: string
  droppable: boolean
}

const COLUMNS: ColumnConfig[] = [
  { id: 'pendiente',      label: 'Pendiente',      color: '#6B7280', droppable: true },
  { id: 'en_preparacion', label: 'En preparación', color: '#D97706', droppable: true },
  { id: 'empacado',       label: 'Empacado',       color: '#2563EB', droppable: true },
  { id: 'en_camino',      label: 'En camino',      color: '#4338CA', droppable: true },
  { id: 'entregado',      label: 'Entregado',      color: '#16A34A', droppable: true },
  { id: 'problema',       label: 'Problema',       color: '#DC2626', droppable: false },
]

const PROBLEMA_STATUSES: OrderStatus[] = ['problema', 'cancelado', 'devuelto']

function isProblemaStatus(status: OrderStatus): boolean {
  return PROBLEMA_STATUSES.includes(status)
}

// ─── Truck icon ────────────────────────────────────────────────

function TruckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 2h8l2-2zM13 6l4 5h3a1 1 0 011 1v4l-2 2h-1" />
    </svg>
  )
}

// ─── Card content ──────────────────────────────────────────────

function CardContent({ order }: { order: OrderSummary }) {
  const isSD = order.zone === 'santo_domingo'
  const formattedTotal = `RD$${order.shopify_total.toLocaleString('es-DO')}`

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-mono">#{order.order_number}</span>
        {order.tracking_number && (
          <span title={`Tracking: ${order.tracking_number}`} className="text-gray-400">
            <TruckIcon />
          </span>
        )}
      </div>
      <p className="font-semibold text-sm text-gray-900 leading-tight truncate">
        {order.customer_name ?? '—'}
      </p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-gray-700 font-medium">{formattedTotal}</span>
        {order.zone && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
              isSD ? 'bg-blue-100 text-blue-700' : 'bg-[#E6F2EE] text-[#1C5E4A]'
            }`}
          >
            {isSD ? 'SD' : 'Interior'}
          </span>
        )}
      </div>
    </>
  )
}

// ─── Draggable card ────────────────────────────────────────────

function DraggableCard({
  order,
  isSelected,
  onSelect,
}: {
  order: OrderSummary
  isSelected: boolean
  onSelect: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    data: { order },
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    touchAction: 'none',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(order.id)}
      className={`bg-white rounded-lg p-3 space-y-1.5 select-none cursor-grab active:cursor-grabbing transition-shadow ${
        isSelected
          ? 'border-2 border-[#1C5E4A] shadow-sm'
          : 'border border-gray-200 shadow-sm hover:shadow-md'
      }`}
    >
      <CardContent order={order} />
    </div>
  )
}

// ─── Static card (Problema — not draggable) ────────────────────

function StaticCard({
  order,
  isSelected,
  onSelect,
}: {
  order: OrderSummary
  isSelected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <div
      onClick={() => onSelect(order.id)}
      className={`bg-white rounded-lg p-3 space-y-1.5 select-none cursor-pointer transition-shadow ${
        isSelected
          ? 'border-2 border-[#1C5E4A] shadow-sm'
          : 'border border-gray-200 shadow-sm hover:shadow-md'
      }`}
    >
      <CardContent order={order} />
    </div>
  )
}

// ─── Empty column state ────────────────────────────────────────

function EmptyColumn() {
  return (
    <p className="text-xs text-gray-400 text-center py-4 select-none">Sin pedidos</p>
  )
}

// ─── Droppable column (columns 1–5) ───────────────────────────

function DroppableColumn({
  config,
  orders,
  selectedId,
  onSelect,
  children,
}: {
  config: ColumnConfig
  orders: OrderSummary[]
  selectedId: string | null
  onSelect: (id: string) => void
  children?: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: config.id })

  return (
    <div
      className="flex-none w-52 bg-gray-50 rounded-xl border border-gray-200 flex flex-col"
      style={isOver ? { outline: `2px dashed ${config.color}`, outlineOffset: '-2px' } : undefined}
    >
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: config.color }}>
          {config.label}
        </span>
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
          style={{ backgroundColor: config.color }}
        >
          {orders.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className="p-2 flex flex-col gap-2 min-h-24 overflow-y-auto max-h-[calc(100vh-230px)]"
      >
        {orders.length === 0 ? <EmptyColumn /> : children}
      </div>
    </div>
  )
}

// ─── Static column (Problema — not droppable) ──────────────────

function StaticColumn({
  config,
  orders,
  selectedId,
  onSelect,
}: {
  config: ColumnConfig
  orders: OrderSummary[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex-none w-52 bg-gray-50 rounded-xl border border-gray-200 flex flex-col">
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: config.color }}>
          {config.label}
        </span>
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
          style={{ backgroundColor: config.color }}
        >
          {orders.length}
        </span>
      </div>
      <div className="p-2 flex flex-col gap-2 min-h-24 overflow-y-auto max-h-[calc(100vh-230px)]">
        {orders.length === 0 ? (
          <EmptyColumn />
        ) : (
          orders.map((order) => (
            <StaticCard
              key={order.id}
              order={order}
              isSelected={selectedId === order.id}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Toast ─────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-red-600 text-white px-4 py-3 rounded-lg shadow-xl">
      <span className="text-sm">{message}</span>
      <button
        onClick={onDismiss}
        className="text-white/70 hover:text-white text-xl leading-none font-light"
        aria-label="Cerrar"
      >
        ×
      </button>
    </div>
  )
}

// ─── Main board ────────────────────────────────────────────────

type ZoneFilter = 'all' | 'santo_domingo' | 'interior'

export default function KanbanBoard({ initialOrders }: { initialOrders: OrderSummary[] }) {
  const router = useRouter()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const [orders, setOrders] = useState<OrderSummary[]>(initialOrders)
  const [filter, setFilter] = useState<ZoneFilter>('all')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 4000)
  }, [])

  function parseCsv(text: string): CsvOrderRow[] {
    // Full CSV parser that handles multi-line quoted fields
    const allRows: string[][] = []
    let cells: string[] = []
    let cur = ''
    let inQuote = false

    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      const next = text[i + 1]
      if (ch === '"') {
        if (inQuote && next === '"') { cur += '"'; i++ }
        else { inQuote = !inQuote }
      } else if (ch === ',' && !inQuote) {
        cells.push(cur); cur = ''
      } else if ((ch === '\n' || ch === '\r') && !inQuote) {
        if (ch === '\r' && next === '\n') i++
        cells.push(cur); cur = ''
        if (cells.some(c => c.trim())) allRows.push(cells)
        cells = []
      } else {
        cur += ch
      }
    }
    if (cur || cells.length) { cells.push(cur); if (cells.some(c => c.trim())) allRows.push(cells) }

    if (allRows.length < 2) return []

    const headers = allRows[0].map(h => h.trim())
    const col = (name: string) => headers.indexOf(name)
    const getCell = (row: string[], name: string) => {
      const i = col(name)
      return i >= 0 ? (row[i] ?? '').trim() : ''
    }

    const seen = new Set<string>()
    const rows: CsvOrderRow[] = []

    for (let i = 1; i < allRows.length; i++) {
      const r = allRows[i]
      const id = getCell(r, 'Id')
      const name = getCell(r, 'Name')
      if (!id || seen.has(id)) continue
      seen.add(id)

      const total = parseFloat(getCell(r, 'Total') || '0') || 0
      const customerName = getCell(r, 'Shipping Name') || getCell(r, 'Billing Name') || null
      const phone = getCell(r, 'Shipping Phone') || getCell(r, 'Billing Phone') || null
      const addr1 = getCell(r, 'Shipping Address1')
      const city  = getCell(r, 'Shipping City')
      const prov  = getCell(r, 'Shipping Province')
      const address = [addr1, city].filter(Boolean).join(', ') || null

      const combined = `${city} ${prov}`.toLowerCase()
      const sdKw = ['santo domingo', 'distrito nacional', 'd.n.', 'sto. dgo', 'sto dgo']
      const zone = sdKw.some(k => combined.includes(k)) ? 'santo_domingo' : 'interior'

      rows.push({
        shopify_id: id,
        order_number: name,
        customer_name: customerName,
        customer_phone: phone,
        customer_address: address,
        customer_province: prov || null,
        shopify_total: total,
        zone,
      })
    }

    return rows
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setIsImporting(true)
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (!rows.length) {
        showToast('No se encontraron pedidos en el archivo.')
        return
      }
      const result = await importOrdersFromCsvAction(rows)
      if (result.error) {
        showToast(result.error)
      } else if (result.imported === 0) {
        showToast('No hay pedidos nuevos para importar.')
      } else {
        showToast(`${result.imported} pedido${result.imported === 1 ? '' : 's'} importado${result.imported === 1 ? '' : 's'} correctamente.`)
        router.refresh()
      }
    } finally {
      setIsImporting(false)
    }
  }

  const visibleOrders =
    filter === 'all' ? orders : orders.filter((o) => o.zone === filter)

  function getColumnOrders(columnId: string): OrderSummary[] {
    if (columnId === 'problema') {
      return visibleOrders.filter((o) => isProblemaStatus(o.status))
    }
    return visibleOrders.filter((o) => o.status === columnId)
  }

  const activeOrder = activeId ? orders.find((o) => o.id === activeId) ?? null : null

  function handleSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id))
  }

  function handleStatusChangeFromPanel(orderId: string, newStatus: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )
  }

  const selectedOrder = selectedId ? orders.find((o) => o.id === selectedId) ?? null : null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const orderId = active.id as string
    const newStatus = over.id as OrderStatus

    const order = orders.find((o) => o.id === orderId)
    if (!order || order.status === newStatus) return

    const prevOrders = [...orders]

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    )

    updateOrderStatusAction(orderId, newStatus).catch(() => {
      setOrders(prevOrders)
      showToast('Error al actualizar el estado. Por favor intenta de nuevo.')
    })
  }

  function handleDragCancel() {
    setActiveId(null)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden px-6 pb-6">
      {/* Filter pills + import button */}
      <div className="flex gap-2 mb-4 items-center">
        {(
          [
            ['all', 'Todos'],
            ['santo_domingo', 'Santo Domingo'],
            ['interior', 'Interior'],
          ] as [ZoneFilter, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === value
                ? 'bg-[#1C5E4A] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {isImporting ? 'Importando…' : 'Importar CSV'}
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-400 text-center max-w-xs">
            No hay pedidos aún. Los nuevos pedidos de Shopify aparecerán aquí automáticamente.
          </p>
        </div>
      ) : (
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 items-start">
          {COLUMNS.map((col) => {
            const colOrders = getColumnOrders(col.id)

            if (!col.droppable) {
              return (
                <StaticColumn
                  key={col.id}
                  config={col}
                  orders={colOrders}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                />
              )
            }

            return (
              <DroppableColumn
                key={col.id}
                config={col}
                orders={colOrders}
                selectedId={selectedId}
                onSelect={handleSelect}
              >
                {colOrders.map((order) => (
                  <DraggableCard
                    key={order.id}
                    order={order}
                    isSelected={selectedId === order.id}
                    onSelect={handleSelect}
                  />
                ))}
              </DroppableColumn>
            )
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeOrder ? (
            <div className="w-52 rotate-1 shadow-2xl opacity-95 bg-white rounded-lg p-3 space-y-1.5 border border-gray-200">
              <CardContent order={activeOrder} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      )}

      <OrderPanel
        order={selectedOrder}
        onClose={() => setSelectedId(null)}
        onStatusChange={handleStatusChangeFromPanel}
        onDelete={(id) => {
          setOrders((prev) => prev.filter((o) => o.id !== id))
          setSelectedId(null)
        }}
      />

      {toastMsg && (
        <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
      )}
    </div>
  )
}
