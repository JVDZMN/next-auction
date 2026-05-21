'use client'

import { useEffect, useState } from 'react'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

function compute(endDate: string | Date): TimeLeft {
  const total = new Date(endDate).getTime() - Date.now()
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  return {
    total,
    days:    Math.floor(total / 86_400_000),
    hours:   Math.floor((total % 86_400_000) / 3_600_000),
    minutes: Math.floor((total % 3_600_000)  / 60_000),
    seconds: Math.floor((total % 60_000)     / 1_000),
  }
}

type Urgency = 'normal' | 'warning' | 'critical'

function urgency(ms: number): Urgency {
  if (ms <= 0)             return 'normal'
  if (ms <  5 * 60_000)   return 'critical'
  if (ms < 60 * 60_000)   return 'warning'
  return 'normal'
}

// Stone-based palette keeps the Nordic neutral baseline;
// amber and red only appear when time actually matters.
const styles: Record<Urgency, string> = {
  normal:   'text-stone-500  bg-stone-50   border-stone-100',
  warning:  'text-amber-700  bg-amber-50   border-amber-100',
  critical: 'text-red-700    bg-red-50     border-red-100',
}

interface Props {
  endDate: string | Date
  /** Show seconds when under 1 hour. Default true. */
  showSeconds?: boolean
  className?: string
}

export function AuctionCountdown({ endDate, showSeconds = true, className = '' }: Props) {
  const [left, setLeft] = useState<TimeLeft>(() => compute(endDate))

  useEffect(() => {
    const tick = () => setLeft(compute(endDate))
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [endDate])

  const u = urgency(left.total)

  if (left.total <= 0) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium text-stone-400 bg-stone-50 border-stone-100 ${className}`}>
        <ClockIcon />
        Afsluttet
      </span>
    )
  }

  const underHour = left.days === 0 && left.hours === 0

  const parts: string[] = []
  if (left.days > 0)  parts.push(`${left.days}d`)
  if (left.hours > 0 || left.days > 0) parts.push(`${left.hours}t`)
  parts.push(`${left.minutes}m`)
  if (showSeconds && underHour) parts.push(`${String(left.seconds).padStart(2, '0')}s`)

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold tabular-nums transition-colors duration-700 ${styles[u]} ${className}`}
    >
      <ClockIcon />
      {parts.join(' ')}
    </span>
  )
}

function ClockIcon() {
  return (
    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
