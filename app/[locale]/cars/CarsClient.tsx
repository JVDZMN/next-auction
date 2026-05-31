'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import dynamic from 'next/dynamic'
import type { CarsMapProps } from '@/components/CarsMap'

const CarsMap = dynamic<CarsMapProps>(
  () => import('@/components/CarsMap').then(m => ({ default: m.CarsMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400 text-sm">
        Loading map...
      </div>
    ),
  }
)
import { Header } from '@/components/Header'
import { CarCard } from '@/components/CarCard'
import { CarCardSkeleton } from '@/components/CarCardSkeleton'
import { getAllBrands, getModelsByBrand } from '@/lib/car-brands'
import { useLocale } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { SlidersHorizontal, X } from 'lucide-react'

const FUEL_OPTIONS = [
  { value: 'Benzin',       label: 'Benzin' },
  { value: 'Diesel',       label: 'Diesel' },
  { value: 'HybridBenzin', label: 'Hybrid benzin' },
  { value: 'HybridDiesel', label: 'Hybrid diesel' },
  { value: 'PluginHybrid', label: 'Plug-in hybrid' },
  { value: 'Electric',     label: 'El (EV)' },
]
const SYN_OPTIONS  = [{ value: 'valid', label: 'Syn gyldig' }, { value: 'expired', label: 'Syn udløbet' }]
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
  auctionEndDate: string; _count: { bids: number }; owner: { name: string | null }
  latitude: number | null; longitude: number | null
}
export interface CarsResponse { cars: CarListing[]; total: number; page: number; pageSize: number; totalPages: number }

const KM_MAX = 500_000

export function CarsClient({ initialData }: { initialData: CarsResponse }) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const locale       = useLocale()
  const brands       = getAllBrands()

  const [brand,      setBrand]     = useState(searchParams?.get('brand')     ?? '')
  const [model,      setModel]     = useState(searchParams?.get('model')     ?? '')
  const [city,       setCity]      = useState(searchParams?.get('city')      ?? '')
  const [fuel,       setFuel]      = useState(searchParams?.get('fuel')      ?? '')
  const [bodyType,   setBodyType]  = useState(searchParams?.get('bodyType')  ?? '')
  const [minPrice,   setMinPrice]  = useState(searchParams?.get('minPrice')  ?? '')
  const [maxPrice,   setMaxPrice]  = useState(searchParams?.get('maxPrice')  ?? '')
  const [minYear,    setMinYear]   = useState(searchParams?.get('minYear')   ?? '')
  const [maxYear,    setMaxYear]   = useState(searchParams?.get('maxYear')   ?? '')
  const [synStatus,  setSynStatus] = useState(searchParams?.get('synStatus') ?? '')
  const [sortBy,     setSortBy]    = useState(searchParams?.get('sortBy')    ?? 'newest')
  const [likedOnly,  setLikedOnly] = useState(searchParams?.get('liked') === 'true')
  const [page,       setPage]      = useState(Number(searchParams?.get('page') ?? 1))
  const [kmRange,    setKmRange]   = useState<[number, number]>([
    Number(searchParams?.get('minKm') ?? 0),
    Number(searchParams?.get('maxKm') ?? KM_MAX),
  ])

  // Start with server-fetched data — no skeleton on first load
  const [data,       setData]       = useState<CarsResponse | null>(initialData)
  const [loading,    setLoading]    = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list')
  const availableModels = brand ? getModelsByBrand(brand) : []

  const carsWithCoords = (data?.cars ?? []).filter(
    (c): c is typeof c & { latitude: number; longitude: number } =>
      c.latitude != null && c.longitude != null
  )

  const buildParams = useCallback((overrides: Record<string, string | number> = {}) => {
    const p: Record<string, string> = {}
    if (brand)               p.brand     = brand
    if (model)               p.model     = model
    if (city)                p.city      = city
    if (fuel)                p.fuel      = fuel
    if (bodyType)            p.bodyType  = bodyType
    if (minPrice)            p.minPrice  = minPrice
    if (maxPrice)            p.maxPrice  = maxPrice
    if (minYear)             p.minYear   = minYear
    if (maxYear)             p.maxYear   = maxYear
    if (kmRange[0] > 0)      p.minKm     = String(kmRange[0])
    if (kmRange[1] < KM_MAX) p.maxKm     = String(kmRange[1])
    if (synStatus)           p.synStatus = synStatus
    if (likedOnly)           p.liked     = 'true'
    if (sortBy !== 'newest') p.sortBy    = sortBy
    p.page = String(page)
    return { ...p, ...Object.fromEntries(Object.entries(overrides).map(([k, v]) => [k, String(v)])) }
  }, [brand, model, city, fuel, bodyType, minPrice, maxPrice, minYear, maxYear, kmRange, synStatus, likedOnly, sortBy, page])

  const fetchCars = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/cars?${new URLSearchParams(buildParams())}`)
      const json = await res.json()
      if (res.ok && Array.isArray(json.cars)) setData(json)
    } finally { setLoading(false) }
  }, [buildParams])

  // Only re-fetch when filters actually change (skip the initial mount — we have server data)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (mounted) fetchCars() }, [fetchCars]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    router.replace(`/${locale}/cars?${new URLSearchParams(buildParams())}`, { scroll: false })
  }, [brand, model, city, fuel, bodyType, minPrice, maxPrice, minYear, maxYear, kmRange, synStatus, likedOnly, sortBy, page, locale]) // eslint-disable-line react-hooks/exhaustive-deps

  const clearFilters = () => {
    setBrand(''); setModel(''); setCity(''); setFuel(''); setBodyType('')
    setMinPrice(''); setMaxPrice(''); setMinYear(''); setMaxYear('')
    setKmRange([0, KM_MAX]); setSynStatus(''); setLikedOnly(false)
    setSortBy('newest'); setPage(1)
  }

  const activeFilterCount = [brand, model, city, fuel, bodyType, minPrice, maxPrice, minYear, maxYear, synStatus, likedOnly ? 'x' : ''].filter(Boolean).length
    + (kmRange[0] > 0 || kmRange[1] < KM_MAX ? 1 : 0)

  const fuelLabel    = fuel      ? (FUEL_OPTIONS.find(f => f.value === fuel)?.label ?? fuel)           : 'Alle'
  const synLabel     = synStatus ? (SYN_OPTIONS.find(s => s.value === synStatus)?.label ?? synStatus)  : 'Alle'
  const sortLabel    = SORT_OPTIONS.find(s => s.value === sortBy)?.label ?? sortBy
  const modelLabel   = model || 'All models'
  const brandLabel   = brand || 'All brands'

  const FilterPanel = (
    <div className="space-y-5 text-sm">
      {session && (
        <div className="flex items-center gap-2">
          <Checkbox id="liked" checked={likedOnly} onCheckedChange={v => { setLikedOnly(!!v); setPage(1) }} />
          <Label htmlFor="liked" className="font-normal cursor-pointer">Liked cars only</Label>
        </div>
      )}

      <Separator />

      <div className="space-y-1.5">
        <Label>Brand</Label>
        <Select value={brand || '__all__'} onValueChange={v => { setBrand(v === '__all__' ? '' : (v ?? '')); setModel(''); setPage(1) }}>
          <SelectTrigger className="h-8 text-xs w-full">
            <SelectValue>{brandLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All brands</SelectItem>
            {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Model</Label>
        {availableModels.length > 0 ? (
          <Select value={model || '__all__'} onValueChange={v => { setModel(v === '__all__' ? '' : (v ?? '')); setPage(1) }}>
            <SelectTrigger className="h-8 text-xs w-full">
              <SelectValue>{modelLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All models</SelectItem>
              {availableModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <Input className="h-8 text-xs" placeholder="Any model" value={model} onChange={e => { setModel(e.target.value); setPage(1) }} />
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Location</Label>
        <Input className="h-8 text-xs" placeholder="City" value={city} onChange={e => { setCity(e.target.value); setPage(1) }} />
      </div>

      <div className="space-y-1.5">
        <Label>Brændstof</Label>
        <Select value={fuel || '__all__'} onValueChange={v => { setFuel(v === '__all__' ? '' : (v ?? '')); setPage(1) }}>
          <SelectTrigger className="h-8 text-xs w-full">
            <SelectValue>{fuelLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Alle</SelectItem>
            {FUEL_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Karrosseri</Label>
        <Input className="h-8 text-xs" placeholder="f.eks. Hatchback" value={bodyType} onChange={e => { setBodyType(e.target.value); setPage(1) }} />
      </div>

      <div className="space-y-2">
        <Label>
          Kilometer{' '}
          <span className="text-muted-foreground font-normal">
            ({kmRange[0].toLocaleString('da-DK')} – {kmRange[1] >= KM_MAX ? '500.000+' : kmRange[1].toLocaleString('da-DK')})
          </span>
        </Label>
        <Slider
          min={0} max={KM_MAX} step={5000}
          value={kmRange}
          onValueChange={v => { setKmRange(v as [number, number]); setPage(1) }}
          className="py-1"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Årgang</Label>
        <div className="flex gap-2">
          <Input className="h-8 text-xs" type="number" placeholder="Fra" value={minYear} onChange={e => { setMinYear(e.target.value); setPage(1) }} />
          <Input className="h-8 text-xs" type="number" placeholder="Til" value={maxYear} onChange={e => { setMaxYear(e.target.value); setPage(1) }} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Syn</Label>
        <Select value={synStatus || '__all__'} onValueChange={v => { setSynStatus(v === '__all__' ? '' : (v ?? '')); setPage(1) }}>
          <SelectTrigger className="h-8 text-xs w-full">
            <SelectValue>{synLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Alle</SelectItem>
            {SYN_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Price (kr)</Label>
        <div className="flex gap-2">
          <Input className="h-8 text-xs" type="number" placeholder="Min" value={minPrice} onChange={e => { setMinPrice(e.target.value); setPage(1) }} />
          <Input className="h-8 text-xs" type="number" placeholder="Max" value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setPage(1) }} />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-400 mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-6">
        <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h1 className="text-2xl font-bold">Cars for Auction</h1>
            {data && !loading && (
              <p className="text-sm text-muted-foreground mt-0.5">{data.total.toLocaleString('da-DK')} listings</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger render={<button />} className="md:hidden inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && <Badge className="h-4 px-1 text-[10px]">{activeFilterCount}</Badge>}
              </SheetTrigger>
              <SheetContent side="left" className="w-72 overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle className="flex items-center justify-between">
                    Filters
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1">
                        <X className="h-3 w-3" /> Clear all
                      </Button>
                    )}
                  </SheetTitle>
                </SheetHeader>
                {FilterPanel}
              </SheetContent>
            </Sheet>

            <Select value={sortBy} onValueChange={v => { setSortBy(v ?? ''); setPage(1) }}>
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue>{sortLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Mobile: list / map toggle */}
        <div className="flex lg:hidden gap-2 mb-4 p-1 bg-gray-100 rounded-lg w-fit">
          <button
            onClick={() => setMobileView('list')}
            className={mobileView === 'list' ? 'px-4 py-2 rounded-md bg-white shadow text-sm font-semibold' : 'px-4 py-2 rounded-md text-sm text-gray-500'}
          >📋 List</button>
          <button
            onClick={() => setMobileView('map')}
            className={mobileView === 'map' ? 'px-4 py-2 rounded-md bg-white shadow text-sm font-semibold' : 'px-4 py-2 rounded-md text-sm text-gray-500'}
          >🗺️ Map</button>
        </div>

        {/* Mobile map view */}
        {mobileView === 'map' && (
          <div className="lg:hidden h-[70vh] rounded-xl overflow-hidden border mb-4">
            <CarsMap cars={carsWithCoords} locale={locale} />
          </div>
        )}

        <div className={`flex gap-6 ${mobileView === 'map' ? 'hidden lg:flex' : 'flex'}`}>
          <aside className="hidden md:block w-56 shrink-0">
            <div className="rounded-xl border bg-card p-4 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold">Filters</span>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs gap-1 text-muted-foreground">
                    <X className="h-3 w-3" /> Clear
                  </Button>
                )}
              </div>
              {FilterPanel}
            </div>
          </aside>

          <div className="flex-1 min-w-0 space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => <CarCardSkeleton key={i} />)}
              </div>
            ) : data?.cars.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground rounded-xl border">
                <p className="text-lg font-medium">No cars found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
                {activeFilterCount > 0 && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data?.cars.map((car, i) => (
                    <CarCard key={car.id} {...car} bidCount={car._count.bids} priority={i < 3} />
                  ))}
                </div>

                {data && data.totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>

                      {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === data.totalPages || Math.abs(p - page) <= 1)
                        .reduce<(number | '...')[]>((acc, p, i, arr) => {
                          if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                          acc.push(p); return acc
                        }, [])
                        .map((p, i) => p === '...' ? (
                          <PaginationItem key={`e${i}`}><PaginationEllipsis /></PaginationItem>
                        ) : (
                          <PaginationItem key={p}>
                            <PaginationLink isActive={p === page} onClick={() => setPage(p as number)} className="cursor-pointer">{p}</PaginationLink>
                          </PaginationItem>
                        ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                          className={page >= data.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </div>
        </div>{/* end inner flex: filter sidebar + car grid */}
        </div>{/* end left column */}

        {/* Desktop sticky map */}
        <div className="hidden lg:block w-105 shrink-0">
          <div className="sticky top-4 h-[calc(100vh-2rem)] rounded-xl overflow-hidden border">
            <CarsMap cars={carsWithCoords} locale={locale} />
          </div>
        </div>
      </div>{/* end outer flex */}
      </main>
    </div>
  )
}
