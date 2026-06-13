'use client'

import { useRouter } from 'next/navigation'
import { useDict, useLocale } from '@/lib/i18n/context'

const YEARS = Array.from({ length: 35 }, (_, i) => 2024 - i)
const BODY_STYLES = ['Sedan', 'SUV', 'Stationcar', 'Hatchback', 'Cabriolet', 'Coupe', 'Van', 'Pickup']
const TRANSMISSIONS = [
  { value: 'Manual',    labelDa: 'Manuel',     labelEn: 'Manual' },
  { value: 'Automatic', labelDa: 'Automatisk',  labelEn: 'Automatic' },
]

export function TopFilterBar() {
  const locale = useLocale()
  const dict = useDict()
  const t = dict.home.marketplace.filters
  const router = useRouter()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const form = e.currentTarget.form
    if (!form) return
    const data = new FormData(form)
    const params: Record<string, string> = {}
    for (const [k, v] of data.entries()) {
      if (typeof v === 'string' && v) params[k] = v
    }
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v))
    router.push(`/${locale}/cars?${q.toString()}`)
  }

  const selectCls =
    'rounded border bg-transparent text-sm font-medium h-9 px-2 pr-7 focus:outline-none focus:ring-1 appearance-none cursor-pointer min-w-[110px]'
  const selectStyle = {
    borderColor: 'var(--border)',
    color: 'var(--text-body)',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
  }

  const isDanish = locale === 'da'

  return (
    <div
      className="sticky top-14 z-40 border-b"
      style={{ backgroundColor: 'var(--page-bg)', borderColor: 'var(--border)' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-12 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <form className="flex items-center gap-2" onSubmit={e => e.preventDefault()}>

          <select
            name="yearFrom"
            aria-label={t.yearFrom}
            className={selectCls}
            style={selectStyle}
            onChange={onChange}
            defaultValue=""
          >
            <option value="">{t.yearFrom}</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select
            name="yearTo"
            aria-label={t.yearTo}
            className={selectCls}
            style={selectStyle}
            onChange={onChange}
            defaultValue=""
          >
            <option value="">{t.yearTo}</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select
            name="gearType"
            aria-label={t.transmission}
            className={selectCls}
            style={selectStyle}
            onChange={onChange}
            defaultValue=""
          >
            <option value="">{t.transmission}</option>
            {TRANSMISSIONS.map(g => (
              <option key={g.value} value={g.value}>
                {isDanish ? g.labelDa : g.labelEn}
              </option>
            ))}
          </select>

          <select
            name="bodyType"
            aria-label={t.bodyStyle}
            className={selectCls}
            style={selectStyle}
            onChange={onChange}
            defaultValue=""
          >
            <option value="">{t.bodyStyle}</option>
            {BODY_STYLES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

        </form>
      </div>
    </div>
  )
}
