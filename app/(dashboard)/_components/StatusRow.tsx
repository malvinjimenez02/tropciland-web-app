import Link from 'next/link'

interface PipelineStage { count: number; subtitle: string }

interface Props {
  pipeline: {
    pendiente:      PipelineStage
    en_preparacion: PipelineStage
    empacado:       PipelineStage
    en_camino:      PipelineStage
    entregado:      PipelineStage
  }
}

const STAGES = [
  { key: 'pendiente',      label: 'Pendiente',    border: '#D1D5DB', color: '#374151' },
  { key: 'en_preparacion', label: 'Preparación',  border: '#FDE68A', color: '#D97706' },
  { key: 'empacado',       label: 'Empacado',     border: '#BFDBFE', color: '#2563EB' },
  { key: 'en_camino',      label: 'En camino',    border: '#C7D2FE', color: '#4338CA' },
  { key: 'entregado',      label: 'Entregado',    border: '#BBF7D0', color: '#16A34A' },
] as const

export default function StatusRow({ pipeline }: Props) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Pipeline activo</h2>
        <Link href="/pedidos" className="text-xs font-medium text-[#2d5c3c] hover:underline">
          Ver tablero →
        </Link>
      </div>

      <div className="grid grid-cols-5 gap-3 items-stretch">
        {STAGES.map(({ key, label, border, color }) => {
          const { count, subtitle } = pipeline[key]
          return (
            <Link key={key} href="/pedidos" className="h-full">
              <div
                className="h-full rounded-xl border p-4 transition-shadow hover:shadow-md"
                style={{ borderColor: border, borderLeftWidth: 3 }}
              >
                <p className="mb-2 text-xs font-medium text-gray-500">{label}</p>
                <p className="text-3xl font-bold tabular-nums" style={{ color }}>
                  {count}
                </p>
                <p className={`mt-1.5 text-[11px] leading-tight text-gray-400 ${!subtitle ? 'invisible' : ''}`}>
                  {subtitle || 'placeholder'}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
