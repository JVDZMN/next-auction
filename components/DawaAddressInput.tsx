'use client'

import { useState, useEffect, useRef } from 'react'

export interface DawaAddress {
  streetName: string
  houseNumber: string
  zipCode: string
  city: string
}

interface DawaSuggestion {
  tekst: string
  adresse: {
    vejnavn: string
    husnr: string
    postnr: string
    postnrnavn: string
  }
}

interface Props {
  onSelect: (address: DawaAddress) => void
}

export function DawaAddressInput({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<DawaSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://api.dataforsyningen.dk/adresser/autocomplete?q=${encodeURIComponent(query)}&per_side=8`
        )
        const data: DawaSuggestion[] = await res.json()
        setSuggestions(data)
        setOpen(data.length > 0)
        setActiveIndex(-1)
      } catch {
        setSuggestions([])
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (suggestion: DawaSuggestion) => {
    setQuery(suggestion.tekst)
    setOpen(false)
    setSuggestions([])
    onSelect({
      streetName: suggestion.adresse.vejnavn,
      houseNumber: suggestion.adresse.husnr,
      zipCode: suggestion.adresse.postnr,
      city: suggestion.adresse.postnrnavn,
    })
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
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Start typing a Danish address..."
          autoComplete="off"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 pr-8"
        />
        {loading && (
          <div className="absolute right-2.5 top-2.5">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

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

      {!loading && query.trim().length >= 2 && suggestions.length === 0 && !open && (
        <p className="mt-1 text-xs text-gray-400">No addresses found</p>
      )}
    </div>
  )
}
