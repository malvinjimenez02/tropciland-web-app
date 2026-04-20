import { getCouriers, getAllMonthlyAds, getAdsCostForMonth, getProducts } from '@/lib/supabase/queries'
import CouriersSection from './CouriersSection'
import AdsSection from './AdsSection'
import ProductsSection from './ProductsSection'

export const dynamic = 'force-dynamic'

export default async function ConfiguracionPage() {
  const currentMonth = new Date().toISOString().slice(0, 7) // 'YYYY-MM'

  const [couriers, adsHistory, products] = await Promise.all([
    getCouriers(),
    getAllMonthlyAds(),
    getProducts(),
  ])

  const adsWithCosts = await Promise.all(
    adsHistory.map(async (ad) => {
      const { adsCostPerOrder, orderCount } = await getAdsCostForMonth(ad.month)
      return { ...ad, adsCostPerOrder, orderCount }
    })
  )

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">Couriers, productos e inventario, y presupuesto de publicidad</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <CouriersSection initialCouriers={couriers} />
        <ProductsSection initialProducts={products} />
        <div className="lg:col-span-2">
          <AdsSection initialAds={adsWithCosts} currentMonth={currentMonth} />
        </div>
      </div>
    </div>
  )
}
