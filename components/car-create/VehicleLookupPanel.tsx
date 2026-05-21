'use client'

import { useState } from 'react'

export interface VehicleLookupResult {
  make: string | null
  model: string | null
  year: number | null
  fuelType: string | null
  hp: number | null
  transmission: string | null
  firstRegistration: string | null
  lastInspection: string | null
  nextInspection: string | null
  km: number | null
  vin: string | null
  licensePlate: string | null
  bodyType: string | null
  category: string | null
  variant: string | null
  engineSize: number | null
  seats: number | null
  weight: number | null
  use: string | null
  color: string | null
  doors: number | null
  maxTowingWeight: number | null
  status: string | null
  coupling: boolean | null
}

interface Props {
  onResult: (v: VehicleLookupResult) => void
}

export function VehicleLookupPanel({ onResult }: Props) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [extraInfo, setExtraInfo] = useState<Partial<VehicleLookupResult> | null>(null)

  const handleLookup = async () => {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setError(null)
    setSuccess(false)
    setExtraInfo(null)

    try {
      const res = await fetch(`/api/motorapi?search=${encodeURIComponent(q)}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Køretøj ikke fundet')
      }
      const v: VehicleLookupResult = await res.json()
      setExtraInfo({ color: v.color, doors: v.doors, maxTowingWeight: v.maxTowingWeight, status: v.status, coupling: v.coupling })
      setSuccess(true)
      onResult(v)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fejl ved opslag')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-medium text-blue-900 mb-1">Hent køretøjsoplysninger automatisk</p>
        <p className="text-xs text-blue-700 mb-3">Indtast registreringsnummer (f.eks. AB12345) eller stelnummer (VIN)</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value.toUpperCase()); setError(null); setSuccess(false) }}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleLookup())}
            placeholder="EL57808 eller VIN..."
            className="flex-1 px-3 py-2 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white uppercase"
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? 'Henter...' : 'Hent oplysninger'}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        {success && <p className="mt-2 text-xs text-green-700 font-medium">✓ Oplysninger hentet — du kan stadig redigere felterne nedenfor</p>}
      </div>

      {extraInfo && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Yderligere oplysninger fra opslaget</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-700">
            {extraInfo.color && <div><span className="font-medium">Farve:</span> {extraInfo.color}</div>}
            {extraInfo.doors != null && <div><span className="font-medium">Døre:</span> {extraInfo.doors}</div>}
            {extraInfo.maxTowingWeight != null && <div><span className="font-medium">Max trailer:</span> {extraInfo.maxTowingWeight} kg</div>}
            {extraInfo.status && <div><span className="font-medium">Status:</span> {extraInfo.status}</div>}
            {extraInfo.coupling != null && <div><span className="font-medium">Trækkrog:</span> {extraInfo.coupling ? 'Ja' : 'Nej'}</div>}
          </div>
        </div>
      )}
    </>
  )
}
