'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  price: number
  label?: string
  size?: 'sm' | 'lg'
}

export function PriceDisplay({ price, label = 'Aktuel pris', size = 'lg' }: Props) {
  const [flash, setFlash] = useState(false)
  const prev = useRef(price)

  useEffect(() => {
    if (prev.current === price) return
    prev.current = price
    setFlash(true)
    const id = setTimeout(() => setFlash(false), 1_400)
    return () => clearTimeout(id)
  }, [price])

  const formatted = price.toLocaleString('da-DK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  return (
    <div
      className={`rounded-lg px-4 py-3 transition-all duration-300 ${
        flash ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : 'bg-transparent ring-1 ring-inset ring-transparent'
      }`}
    >
      {label && (
        <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-0.5">
          {label}
        </p>
      )}
      <p
        className={`font-bold tabular-nums transition-colors duration-300 ${
          flash ? 'text-blue-700' : 'text-stone-900'
        } ${size === 'lg' ? 'text-3xl' : 'text-xl'}`}
      >
        {formatted} <span className="text-base font-semibold">kr</span>
      </p>
    </div>
  )
}
