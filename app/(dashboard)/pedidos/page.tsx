import { getOrders } from '@/lib/supabase/queries'
import KanbanBoard from './KanbanBoard'

export default async function PedidosPage() {
  const orders = await getOrders()

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-4 flex-shrink-0">
        <h1 className="text-2xl font-semibold text-gray-900">Pedidos</h1>
      </div>
      <KanbanBoard initialOrders={orders} />
    </div>
  )
}
