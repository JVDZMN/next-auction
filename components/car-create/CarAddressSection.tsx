'use client'

import { useState, useEffect, useRef } from 'react'
import { MotionInput } from './MotionInput'

interface DawaSuggestion {
  tekst: string
  adresse: {
    vejnavn:     string
    husnr:       string
    postnr:      string
    postnrnavn:  string
    x?:          number  // longitude
    y?:          number  // latitude
  }
}

type ChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => void

interface AddressData {
  streetName:  string
  houseNumber: string
  zipcode:     string
  city:        string
}

interface Props {
  formData:        AddressData
  onChange:        ChangeHandler
  onAddressSelect: (addr: AddressData) => void
  onCoordinates?:  (lat: number, lng: number) => void
}

export function CarAddressSection({ formData, onChange, onAddressSelect, onCoordinates }: Props) {
  const [suggestions,  setSuggestions]  = useState<DawaSuggestion[]>([])
  const [open,         setOpen]         = useState(false)
  const [activeIndex,  setActiveIndex]  = useState(-1)
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef   = useRef<HTMLDivElement>(null)
  const justSelectedRef = useRef(false)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (justSelectedRef.current) {
      justSelectedRef.current = false
      return
    }

    const q = formData.streetName.trim()
    if (q.length < 2) { setSuggestions([]); setOpen(false); return }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.dataforsyningen.dk/adresser/autocomplete?q=${encodeURIComponent(q)}&per_side=8`
        )
        const data: DawaSuggestion[] = await res.json()
        setSuggestions(data)
        setOpen(data.length > 0)
        setActiveIndex(-1)
      } catch {
        setSuggestions([])
        setOpen(false)
      }
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [formData.streetName])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (s: DawaSuggestion) => {
    justSelectedRef.current = true
    setOpen(false)
    setSuggestions([])
    onAddressSelect({
      streetName:  s.adresse.vejnavn,
      houseNumber: s.adresse.husnr,
      zipcode:     s.adresse.postnr,
      city:        s.adresse.postnrnavn,
    })
    if (onCoordinates && s.adresse.y != null && s.adresse.x != null) {
      onCoordinates(s.adresse.y, s.adresse.x)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        {/* Street name with inline DAWA autocomplete */}
        <div ref={containerRef} className="md:col-span-2 relative">
          <label htmlFor="streetName" className="block text-sm font-medium text-gray-700 mb-1">
            Street Name
          </label>
          <MotionInput
            id="streetName"
            name="streetName"
            type="text"
            value={formData.streetName}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder="Vesterbrogade"
            autoComplete="off"
          />
          {open && (
            <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  onMouseDown={e => { e.preventDefault(); handleSelect(s) }}
                  className={`px-3 py-2 text-sm cursor-pointer ${
                    i === activeIndex
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {s.tekst}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-700 mb-1">No.</label>
          <MotionInput
            id="houseNumber" name="houseNumber" type="text"
            value={formData.houseNumber} onChange={onChange}
            placeholder="12"
          />
        </div>

        <div>
          <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
          <MotionInput
            id="zipcode" name="zipcode" type="text"
            value={formData.zipcode} onChange={onChange}
            placeholder="1234" maxLength={4}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <MotionInput
            id="city" name="city" type="text"
            value={formData.city} onChange={onChange}
            placeholder="Copenhagen"
          />
        </div>

      </div>
    </div>
  )
}
