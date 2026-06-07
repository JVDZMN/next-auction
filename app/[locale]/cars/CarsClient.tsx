'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { CarsMapProps } from '@/components/CarsMap'
import { FilterPanel, KM_MAX } from '@/components/cars/FilterPanel'
import { CarGrid } from '@/components/cars/CarGrid'
import { getAllBrands, getModelsByBrand } from '@/lib/car-brands'
import { useLocale } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SlidersHorizontal, X, Map } from 'lucide-react'

const CarsMap = dynamic<CarsMapProps>(
  () => import('@/components/CarsMap').then(m => ({ default: m.CarsMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400 text-sm">Loading map...</div>
    ),
  }
)

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest first' },
  { value: 'endingSoon', label: 'Ending soon' },
  { value: 'priceAsc',   label: 'Price: low → high' },
  { value: 'priceDesc',  label: 'Price: high → low' },
]

interface CarListing {
  id: string; brand: string; model: string; subModel: string | null; year: number
  currentPrice: number; images: string[]; fuel: string | null; km: number
  city: string | null; bodyType: string | null; condition: string
  auctionEndDate: string; _count: { bids: number }
  owner: { name: string | null; role?: string }
  latitude: number | null; longitude: number | null
}
export interface CarsResponse { cars: CarListing[]; total: number; page: number; pageSize: number; totalPages: number }

export function CarsClient({ initialData, role }: { initialData: CarsResponse; role?: string }) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const locale       = useLocale()
  const brands       = getAllBrands()

  const forcedSegment: 'private' | 'business' | undefined =
    role === 'PRIVATE_USER' ? 'private' : role === 'BUSINESS_USER' ? 'business' : undefined

  const [filters, setFilters] = useState({
    brand:     searchParams?.get('brand')     ?? '',
    model:     searchParams?.get('model')     ?? '',
    city:      searchParams?.get('city')      ?? '',
    fuel:      searchParams?.get('fuel')      ?? '',
    bodyType:  searchParams?.get('bodyType')  ?? '',
    minPrice:  searchParams?.get('minPrice')  ?? '',
    maxPrice:  searchParams?.get('maxPrice')  ?? '',
    minYear:   searchParams?.get('minYear')   ?? '',
    maxYear:   searchParams?.get('maxYear')   ?? '',
    synStatus: searchParams?.get('synStatus') ?? '',
    likedOnly: searchParams?.get('liked') === 'true',
    kmRange:   [Number(searchParams?.get('minKm') ?? 0), Number(searchParams?.get('maxKm') ?? KM_MAX)] as [number, number],
  })
  const [sortBy,   setSortBy]   = useState(searchParams?.get('sortBy') ?? 'newest')
  const [segment,  setSegment]  = useState<'private' | 'business'>(
    forcedSegment ?? (searchParams?.get('segment') === 'business' ? 'business' : 'private')
  )
  const [page,     setPage]     = useState(Number(searchParams?.get('page') ?? 1))
  const [data,     setData]     = useState<CarsResponse | null>(initialData)
  const [loading,  setLoading]  = useState(false)
  const [showMap,  setShowMap]  = useState(false)

  const availableModels = filters.brand ? getModelsByBrand(filters.brand) : []

  const carsWithCoords = (data?.cars ?? []).filter(
    (c): c is typeof c & { latitude: number; longitude: number } => c.latitude != null && c.longitude != null
  )

  const buildParams = useCallback((overrides: Record<string, string | number> = {}) => {
    const { brand, model, city, fuel, bodyType, minPrice, maxPrice, minYear, maxYear, synStatus, likedOnly, kmRange } = filters
    const p: Record<string, string> = {}
    if (brand)                    p.brand     = brand
    if (model)                    p.model     = model
    if (city)                     p.city      = city
    if (fuel)                     p.fuel      = fuel
    if (bodyType)                 p.bodyType  = bodyType
    if (minPrice)                 p.minPrice  = minPrice
    if (maxPrice)                 p.maxPrice  = maxPrice
    if (minYear)                  p.minYear   = minYear
    if (maxYear)                  p.maxYear   = maxYear
    if (kmRange[0] > 0)           p.minKm     = String(kmRange[0])
    if (kmRange[1] < KM_MAX)      p.maxKm     = String(kmRange[1])
    if (synStatus)                p.synStatus = synStatus
    if (likedOnly)                p.liked     = 'true'
    if (sortBy !== 'newest')      p.sortBy    = sortBy
    p.segment = segment
    p.page    = String(page)
    return { ...p, ...Object.fromEntries(Object.entries(overrides).map(([k, v]) => [k, String(v)])) }
  }, [filters, sortBy, segment, page])

  const fetchCars = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/cars?${new URLSearchParams(buildParams())}`)
      const json = await res.json()
      if (res.ok && Array.isArray(json.cars)) setData(json)
    } finally { setLoading(false) }
  }, [buildParams])

  // Skip the fetch on the very first render — initialData already came from the server.
  // After that, re-fetch whenever filters/sort/page change (captured in fetchCars via buildParams).
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (mounted) fetchCars() }, [fetchCars]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    router.replace(`/${locale}/cars?${new URLSearchParams(buildParams())}`, { scroll: false })
  }, [filters, sortBy, page, locale]) // eslint-disable-line react-hooks/exhaustive-deps

  const patchFilters = (patch: Partial<typeof filters>) => { setFilters(f => ({ ...f, ...patch })); setPage(1) }

  const clearFilters = () => {
    setFilters({ brand: '', model: '', city: '', fuel: '', bodyType: '', minPrice: '', maxPrice: '', minYear: '', maxYear: '', synStatus: '', likedOnly: false, kmRange: [0, KM_MAX] })
    setSortBy('newest'); setPage(1)
  }

  const activeFilterCount =
    [filters.brand, filters.model, filters.city, filters.fuel, filters.bodyType, filters.minPrice, filters.maxPrice, filters.minYear, filters.maxYear, filters.synStatus, filters.likedOnly ? 'x' : ''].filter(Boolean).length
    + (filters.kmRange[0] > 0 || filters.kmRange[1] < KM_MAX ? 1 : 0)

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-400 mx-auto px-4 lg:px-6 pt-20 pb-6">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between mb-4 gap-2">
              <div>
                <h1 className="text-2xl font-bold">Cars for Auction</h1>
                {data && !loading && <p className="text-sm text-muted-foreground mt-0.5">{data.total.toLocaleString('da-DK')} listings</p>}

                {/* Segment tabs */}
                <div className="flex gap-1 mt-3 p-1 rounded-lg w-fit" style={{ backgroundColor: 'var(--section-alt)' }}>
                  {(['private', 'business'] as const).map(seg => {
                    const isActive   = segment === seg
                    const isDisabled = !!forcedSegment && forcedSegment !== seg
                    return (
                      <button type="button" key={seg} disabled={isDisabled}
                        onClick={() => { if (!forcedSegment) { setSegment(seg); setPage(1) } }}
                        className="flex items-center gap-1 px-2 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                        style={isActive
                          ? { backgroundColor: 'var(--copper)', color: 'white' }
                          : { color: 'var(--text-muted)', backgroundColor: 'transparent' }}
                      >
                        {seg === 'private' ? '🏠 Private Auktioner' : '🏢 Erhvervsauktioner'}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile filter sheet */}
                <Sheet>
                  <SheetTrigger render={<button type="button" title="Åbn filtre" />} className="md:hidden inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-md border transition-colors" style={{ borderColor: 'rgba(0,0,0,0.15)', color: 'var(--text-body)' }}>
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtre
                    {activeFilterCount > 0 && <Badge className="h-4 px-1 text-[10px]">{activeFilterCount}</Badge>}
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 overflow-y-auto">
                    <SheetHeader className="mb-4">
                      <SheetTitle className="flex items-center justify-between">
                        Filtre
                        {activeFilterCount > 0 && (
                          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1">
                            <X className="h-3 w-3" /> Ryd alt
                          </Button>
                        )}
                      </SheetTitle>
                    </SheetHeader>
                    <FilterPanel filters={filters} brands={brands} availableModels={availableModels} onChange={patchFilters} />
                  </SheetContent>
                </Sheet>

                <button
                  type="button"
                  title={showMap ? 'Skjul kort' : 'Vis kort'}
                  onClick={() => setShowMap(m => !m)}
                  className="inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-md border transition-colors"
                  style={showMap
                    ? { backgroundColor: 'var(--copper)', color: 'white', borderColor: 'var(--copper)' }
                    : { color: 'var(--text-body)', borderColor: 'rgba(0,0,0,0.15)', backgroundColor: 'transparent' }}
                >
                  <Map className="h-4 w-4" />
                  {showMap ? 'Skjul kort' : 'Vis kort'}
                </button>

                <Select value={sortBy} onValueChange={v => { setSortBy(v ?? ''); setPage(1) }}>
                  <SelectTrigger className="w-32 sm:w-44 h-9 text-xs">
                    <SelectValue>{SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? sortBy}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showMap && (
              <div className="lg:hidden h-[70vh] rounded-xl overflow-hidden border mb-4">
                <CarsMap cars={carsWithCoords} locale={locale} />
              </div>
            )}

            <div className={`flex gap-6 ${showMap ? 'hidden lg:flex' : 'flex'}`}>
              <aside className="hidden md:block w-56 shrink-0">
                <div className="rounded-xl border bg-card p-4 sticky top-18">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold">Filters</span>
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs gap-1 text-muted-foreground">
                        <X className="h-3 w-3" /> Clear
                      </Button>
                    )}
                  </div>
                  <FilterPanel filters={filters} brands={brands} availableModels={availableModels} onChange={patchFilters} />
                </div>
              </aside>

              <div className="flex-1 min-w-0">
                <CarGrid
                  cars={data?.cars} loading={loading}
                  hasFilters={activeFilterCount > 0}
                  page={page} totalPages={data?.totalPages ?? 1}
                  onPageChange={setPage}
                  onClearFilters={clearFilters}
                />
              </div>
            </div>
          </div>

          {showMap && (
            <div className="hidden lg:block w-105 shrink-0">
              <div className="sticky top-18 h-[calc(100vh-5rem)] rounded-xl overflow-hidden border">
                <CarsMap cars={carsWithCoords} locale={locale} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
