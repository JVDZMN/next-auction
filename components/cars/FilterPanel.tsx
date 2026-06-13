'use client'

import { useSession } from 'next-auth/react'
import { useDict } from '@/lib/i18n/context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const FUEL_OPTIONS = [
  { value: 'Benzin',       label: 'Benzin' },
  { value: 'Diesel',       label: 'Diesel' },
  { value: 'HybridBenzin', label: 'Hybrid benzin' },
  { value: 'HybridDiesel', label: 'Hybrid diesel' },
  { value: 'PluginHybrid', label: 'Plug-in hybrid' },
  { value: 'Electric',     label: 'El (EV)' },
]
export const SYN_OPTIONS = [{ value: 'valid', label: 'Syn gyldig' }, { value: 'expired', label: 'Syn udløbet' }]
export const KM_MAX = 500_000

interface Filters {
  brand: string; model: string; city: string; fuel: string; bodyType: string
  minPrice: string; maxPrice: string; minYear: string; maxYear: string
  synStatus: string; likedOnly: boolean; noReserve: boolean; kmRange: [number, number]
}

interface Props {
  filters: Filters
  brands: string[]
  availableModels: string[]
  onChange: (patch: Partial<Filters>) => void
}

export function FilterPanel({ filters, brands, availableModels, onChange }: Props) {
  const { data: session } = useSession()
  const tf = useDict().cars.filter
  const { brand, model, city, fuel, bodyType, minPrice, maxPrice, minYear, maxYear, synStatus, likedOnly, noReserve, kmRange } = filters

  const set = (patch: Partial<Filters>) => onChange(patch)

  return (
    <div className="space-y-5 text-sm">
      <div className="flex items-center gap-2">
        <Checkbox id="noReserve" checked={noReserve} onCheckedChange={v => set({ noReserve: !!v })} />
        <Label htmlFor="noReserve" className="font-normal cursor-pointer">{tf.noReserve}</Label>
      </div>
      {session && (
        <div className="flex items-center gap-2">
          <Checkbox id="liked" checked={likedOnly} onCheckedChange={v => set({ likedOnly: !!v })} />
          <Label htmlFor="liked" className="font-normal cursor-pointer">{tf.liked}</Label>
        </div>
      )}
      <Separator />

      <div className="space-y-1.5">
        <Label>Brand</Label>
        <Select value={brand || '__all__'} onValueChange={v => set({ brand: v === '__all__' ? '' : (v ?? ''), model: '' })}>
          <SelectTrigger className="h-8 text-xs w-full"><SelectValue>{brand || 'All brands'}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All brands</SelectItem>
            {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Model</Label>
        {availableModels.length > 0 ? (
          <Select value={model || '__all__'} onValueChange={v => set({ model: v === '__all__' ? '' : (v ?? '') })}>
            <SelectTrigger className="h-8 text-xs w-full"><SelectValue>{model || 'All models'}</SelectValue></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All models</SelectItem>
              {availableModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <Input className="h-8 text-xs" placeholder="Any model" value={model} onChange={e => set({ model: e.target.value })} />
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Location</Label>
        <Input className="h-8 text-xs" placeholder="City" value={city} onChange={e => set({ city: e.target.value })} />
      </div>

      <div className="space-y-1.5">
        <Label>Brændstof</Label>
        <Select value={fuel || '__all__'} onValueChange={v => set({ fuel: v === '__all__' ? '' : (v ?? '') })}>
          <SelectTrigger className="h-8 text-xs w-full"><SelectValue>{FUEL_OPTIONS.find(f => f.value === fuel)?.label ?? 'Alle'}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Alle</SelectItem>
            {FUEL_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Karrosseri</Label>
        <Input className="h-8 text-xs" placeholder="f.eks. Hatchback" value={bodyType} onChange={e => set({ bodyType: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label>
          Kilometer{' '}
          <span className="text-muted-foreground font-normal">
            ({kmRange[0].toLocaleString('da-DK')} – {kmRange[1] >= KM_MAX ? '500.000+' : kmRange[1].toLocaleString('da-DK')})
          </span>
        </Label>
        <Slider min={0} max={KM_MAX} step={5000} value={kmRange} onValueChange={v => set({ kmRange: v as [number, number] })} className="py-1" />
      </div>

      <div className="space-y-1.5">
        <Label>Årgang</Label>
        <div className="flex gap-2">
          <Input className="h-8 text-xs" type="number" placeholder="Fra" value={minYear} onChange={e => set({ minYear: e.target.value })} />
          <Input className="h-8 text-xs" type="number" placeholder="Til" value={maxYear} onChange={e => set({ maxYear: e.target.value })} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Syn</Label>
        <Select value={synStatus || '__all__'} onValueChange={v => set({ synStatus: v === '__all__' ? '' : (v ?? '') })}>
          <SelectTrigger className="h-8 text-xs w-full"><SelectValue>{SYN_OPTIONS.find(s => s.value === synStatus)?.label ?? 'Alle'}</SelectValue></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Alle</SelectItem>
            {SYN_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Price (kr)</Label>
        <div className="flex gap-2">
          <Input className="h-8 text-xs" type="number" placeholder="Min" value={minPrice} onChange={e => set({ minPrice: e.target.value })} />
          <Input className="h-8 text-xs" type="number" placeholder="Max" value={maxPrice} onChange={e => set({ maxPrice: e.target.value })} />
        </div>
      </div>
    </div>
  )
}
