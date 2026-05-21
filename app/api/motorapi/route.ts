import { NextRequest, NextResponse } from 'next/server'

function parseNum(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return isNaN(value) ? null : value
  const n = parseFloat(String(value).replace(',', '.').replace(/[^\d.]/g, ''))
  return isNaN(n) ? null : n
}

function parseIsoDate(value: unknown): string | null {
  if (!value) return null
  // Handles "2009-06-12+02:00", "2025-10-02", "16.07.2025"
  const s = String(value)
  const dot = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (dot) return `${dot[3]}-${dot[2]}-${dot[1]}`
  const iso = s.match(/^(\d{4}-\d{2}-\d{2})/)
  if (iso) return iso[1]
  return null
}

const FUEL_MAP: Record<string, string> = {
  benzin: 'Benzin',
  diesel: 'Diesel',
  el: 'Electric',
  'hybrid benzin': 'Hybrid',
  'hybrid diesel': 'Hybrid',
  hybrid: 'Hybrid',
  'plugin hybrid benzin': 'PluginHybrid',
  'plugin hybrid diesel': 'PluginHybrid',
  'plugin hybrid': 'PluginHybrid',
  'plug-in hybrid benzin': 'PluginHybrid',
}

const GEAR_MAP: Record<string, string> = {
  automatisk: 'Automatic',
  automatic: 'Automatic',
  manuelt: 'Manual',
  manuel: 'Manual',
  manual: 'Manual',
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search')
  if (!search?.trim()) {
    return NextResponse.json({ error: 'Missing search parameter' }, { status: 400 })
  }

  const token = process.env.MOTORAPI_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'API token not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://v1.motorapi.dk/vehicles/${encodeURIComponent(search.trim())}`,
      { headers: { 'X-AUTH-TOKEN': token }, cache: 'no-store' }
    )

    if (res.status === 404) {
      return NextResponse.json({ error: 'Køretøj ikke fundet' }, { status: 404 })
    }
    if (!res.ok) {
      const text = await res.text()
      console.error('MotorAPI error:', res.status, text)
      return NextResponse.json({ error: 'MotorAPI fejl' }, { status: res.status })
    }

    const data = await res.json()
    const v = Array.isArray(data) ? data[0] : data
    if (!v) {
      return NextResponse.json({ error: 'Køretøj ikke fundet' }, { status: 404 })
    }

    // engine_volume comes in cc (e.g. 1390) → convert to liters (1.4)
    const engineLiters =
      v.engine_volume && v.engine_volume > 0
        ? Math.round(v.engine_volume / 100) / 10
        : null

    // transmission: not a direct field — parse from variant string (e.g. "1,4 TSI AUT.")
    const variantUpper = (v.variant ?? '').toUpperCase()
    const gearFromVariant = variantUpper.includes('AUT')
      ? 'Automatic'
      : variantUpper.includes('MAN')
      ? 'Manual'
      : null

    const mapped = {
      // Form-fillable fields
      make: v.make ?? null,
      model: v.model ?? null,
      year: (v.model_year && v.model_year !== 0)
        ? v.model_year
        : v.first_registration ? parseInt(String(v.first_registration).slice(0, 4)) : null,
      fuelType: FUEL_MAP[(v.fuel_type ?? '').toLowerCase()] ?? v.fuel_type ?? null,
      hp: v.engine_power && v.engine_power > 0 ? v.engine_power : null,
      transmission:
        GEAR_MAP[(v.transmission ?? '').toLowerCase()] ?? gearFromVariant,
      lastInspection: parseIsoDate(v.mot_info?.date ?? null),
      nextInspection: parseIsoDate(v.mot_info?.next_inspection_date ?? null),
      km: v.mot_info?.mileage && v.mot_info.mileage > 0 ? v.mot_info.mileage : null,
      vin: v.vin ?? null,
      licensePlate: v.registration_number ?? null,

      // Extra info panel (not stored in DB)
      engineSize: engineLiters,
      weight: parseNum(v.total_weight),
      maxTowingWeight: v.trailer_maxweight_withbrakes > 0 ? parseNum(v.trailer_maxweight_withbrakes) : null,
      seats: parseNum(v.seats),
      doors: parseNum(v.doors),
      color: v.color ?? null,
      bodyType: v.chassis_type || null,
      category: v.type ?? null,
      variant: v.variant ?? null,
      firstRegistration: parseIsoDate(v.first_registration),
      status: v.status ?? null,
      use: v.use ?? null,
      coupling: v.coupling ?? null,
    }

    return NextResponse.json(mapped)
  } catch (err) {
    console.error('motorapi route error:', err)
    return NextResponse.json({ error: 'Intern fejl' }, { status: 500 })
  }
}
