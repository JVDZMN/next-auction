'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/Header'
import { CarCard } from '@/components/CarCard'
import { getAllBrands, getModelsByBrand } from '@/lib/car-brands'
import { useLocale } from '@/lib/i18n/context'

const FUEL_OPTIONS: { value: string; label: string }[] = [
  { value: 'Benzin',      label: 'Benzin' },
  { value: 'Diesel',      label: 'Diesel' },
  { value: 'HybridBenzin',label: 'Hybrid benzin' },
  { value: 'HybridDiesel',label: 'Hybrid diesel' },
  { value: 'PluginHybrid',label: 'Plug-in hybrid' },
  { value: 'Electric',    label: 'El (EV)' },
]

const SYN_OPTIONS = [
  { value: 'valid',   label: 'Syn gyldig' },
  { value: 'expired', label: 'Syn udløbet' },
]
const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest first' },
  { value: 'endingSoon',label: 'Ending soon' },
  { value: 'priceAsc',  label: 'Price: low to high' },
  { value: 'priceDesc', label: 'Price: high to low' },
]

interface CarListing {
  id: string
  brand: string
  model: string
  subModel: string | null
  year: number
  currentPrice: number
  images: string[]
  fuel: string | null
  km: number
  city: string | null
  bodyType: string | null
  condition: string
  auctionEndDate: string
  _count: { bids: number }
  owner: { name: string | null }
}

interface CarsResponse {
  cars: CarListing[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white'
const labelCls = 'block text-xs font-medium text-gray-600 mb-1'

export default function CarsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const locale = useLocale()
  const brands = getAllBrands()

  const [brand,    setBrand]    = useState(searchParams?.get('brand')    ?? '')
  const [model,    setModel]    = useState(searchParams?.get('model')    ?? '')
  const [city,     setCity]     = useState(searchParams?.get('city')     ?? '')
  const [fuel,     setFuel]     = useState(searchParams?.get('fuel')     ?? '')
  const [bodyType, setBodyType] = useState(searchParams?.get('bodyType') ?? '')
  const [minPrice, setMinPrice] = useState(searchParams?.get('minPrice') ?? '')
  const [maxPrice, setMaxPrice] = useState(searchParams?.get('maxPrice') ?? '')
  const [minYear,  setMinYear]  = useState(searchParams?.get('minYear')  ?? '')
  const [maxYear,  setMaxYear]  = useState(searchParams?.get('maxYear')  ?? '')
  const [minKm,    setMinKm]    = useState(searchParams?.get('minKm')    ?? '')
  const [maxKm,    setMaxKm]    = useState(searchParams?.get('maxKm')    ?? '')
  const [synStatus,setSynStatus]= useState(searchParams?.get('synStatus') ?? '')
  const [sortBy,   setSortBy]   = useState(searchParams?.get('sortBy')   ?? 'newest')
  const [likedOnly, setLikedOnly] = useState(searchParams?.get('liked') === 'true')
  const [page,     setPage]     = useState(Number(searchParams?.get('page') ?? 1))

  const [data,    setData]    = useState<CarsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const availableModels = brand ? getModelsByBrand(brand) : []

  const buildParams = useCallback((overrides: Record<string, string | number> = {}) => {
    const p: Record<string, string> = {}
    if (brand)     p.brand    = brand
    if (model)     p.model    = model
    if (city)      p.city     = city
    if (fuel)      p.fuel     = fuel
    if (bodyType)  p.bodyType = bodyType
    if (minPrice)   p.minPrice  = minPrice
    if (maxPrice)   p.maxPrice  = maxPrice
    if (minYear)    p.minYear   = minYear
    if (maxYear)    p.maxYear   = maxYear
    if (minKm)      p.minKm     = minKm
    if (maxKm)      p.maxKm     = maxKm
    if (synStatus)  p.synStatus = synStatus
    if (likedOnly)  p.liked     = 'true'
    if (sortBy !== 'newest') p.sortBy = sortBy
    p.page = String(page)
    return { ...p, ...Object.fromEntries(Object.entries(overrides).map(([k, v]) => [k, String(v)])) }
  }, [brand, model, city, fuel, bodyType, minPrice, maxPrice, minYear, maxYear, minKm, maxKm, synStatus, likedOnly, sortBy, page])

  const fetchCars = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams(buildParams())
    try {
      const res = await fetch(`/api/cars?${params}`)
      const json: CarsResponse = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  useEffect(() => { fetchCars() }, [fetchCars])

  useEffect(() => {
    const params = buildParams()
    const qs = new URLSearchParams(params).toString()
    router.replace(`/${locale}/cars?${qs}`, { scroll: false })
  }, [brand, model, city, fuel, bodyType, minPrice, maxPrice, minYear, maxYear, minKm, maxKm, synStatus, likedOnly, sortBy, page, locale])

  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setter(e.target.value)
    setPage(1)
  }

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBrand(e.target.value)
    setModel('')
    setPage(1)
  }

  const clearFilters = () => {
    setBrand(''); setModel(''); setCity(''); setFuel(''); setBodyType('')
    setMinPrice(''); setMaxPrice(''); setMinYear(''); setMaxYear('')
    setMinKm(''); setMaxKm(''); setSynStatus('')
    setLikedOnly(false); setSortBy('newest'); setPage(1)
  }

  const hasFilters = brand || model || city || fuel || bodyType || minPrice || maxPrice || minYear || maxYear || minKm || maxKm || synStatus || likedOnly
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filterContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">Filters</span>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline">Clear all</button>
        )}
      </div>

      {session && (
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={likedOnly}
            onChange={e => { setLikedOnly(e.target.checked); setPage(1) }}
            className="rounded text-blue-600"
          />
          <span className="text-sm text-gray-700">Liked cars only</span>
        </label>
      )}

      <div>
        <label className={labelCls}>Brand</label>
        <select value={brand} onChange={handleBrandChange} className={inputCls}>
          <option value="">All brands</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Model</label>
        {availableModels.length > 0 ? (
          <select value={model} onChange={handleFilterChange(setModel)} className={inputCls}>
            <option value="">All models</option>
            {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        ) : (
          <input type="text" value={model} onChange={handleFilterChange(setModel)} placeholder="Any model" className={inputCls} />
        )}
      </div>

      <div>
        <label className={labelCls}>Location</label>
        <input type="text" value={city} onChange={handleFilterChange(setCity)} placeholder="City" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Brændstof</label>
        <select value={fuel} onChange={handleFilterChange(setFuel)} className={inputCls}>
          <option value="">Alle</option>
          {FUEL_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Karrosseri</label>
        <input type="text" value={bodyType} onChange={handleFilterChange(setBodyType)} placeholder="f.eks. Hatchback" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Årgang</label>
        <div className="flex gap-2">
          <input type="number" value={minYear} onChange={handleFilterChange(setMinYear)} placeholder="Fra" className={inputCls} />
          <input type="number" value={maxYear} onChange={handleFilterChange(setMaxYear)} placeholder="Til" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Kilometer</label>
        <div className="flex gap-2">
          <input type="number" value={minKm} onChange={handleFilterChange(setMinKm)} placeholder="Min" min="0" className={inputCls} />
          <input type="number" value={maxKm} onChange={handleFilterChange(setMaxKm)} placeholder="Max" min="0" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Syn</label>
        <select value={synStatus} onChange={handleFilterChange(setSynStatus)} className={inputCls}>
          <option value="">Alle</option>
          {SYN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Price (kr)</label>
        <div className="flex gap-2">
          <input type="number" value={minPrice} onChange={handleFilterChange(setMinPrice)} placeholder="Min" className={inputCls} />
          <input type="number" value={maxPrice} onChange={handleFilterChange(setMaxPrice)} placeholder="Max" className={inputCls} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold text-gray-900">Filters</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded hover:bg-gray-100 text-gray-500"
                aria-label="Close filters"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {filterContent}
            </div>
            <div className="p-4 border-t">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
              >
                Show {data?.total ?? ''} results
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cars for Auction</h1>
            {data && !loading && (
              <p className="text-sm text-gray-500 mt-0.5">{data.total.toLocaleString('da-DK')} listings</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 10h10M11 16h2" />
              </svg>
              Filters
              {hasFilters && <span className="w-2 h-2 rounded-full bg-blue-600" />}
            </button>
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value); setPage(1) }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          <aside className="hidden md:block w-56 shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-4">
              {filterContent}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                    <div className="aspect-4/3 bg-gray-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.cars.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <p className="text-lg font-medium">No cars found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data?.cars.map(car => (
                    <CarCard
                      key={car.id}
                      id={car.id}
                      brand={car.brand}
                      model={car.model}
                      subModel={car.subModel}
                      year={car.year}
                      currentPrice={car.currentPrice}
                      images={car.images}
                      fuel={car.fuel}
                      km={car.km}
                      city={car.city}
                      bodyType={car.bodyType}
                      condition={car.condition}
                      auctionEndDate={car.auctionEndDate}
                      bidCount={car._count.bids}
                      owner={car.owner}
                    />
                  ))}
                </div>

                {data && data.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage(p => p - 1)}
                      disabled={page <= 1}
                      className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === data.totalPages || Math.abs(p - page) <= 2)
                      .reduce<(number | '...')[]>((acc, p, i, arr) => {
                        if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                        acc.push(p)
                        return acc
                      }, [])
                      .map((p, i) =>
                        p === '...' ? (
                          <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPage(p as number)}
                            className={`w-9 h-9 text-sm font-medium rounded-lg border transition-colors ${
                              p === page
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}

                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= (data?.totalPages ?? 1)}
                      className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
