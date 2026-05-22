'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TimeLeft {
  days: number; hours: number; minutes: number; seconds: number; total: number
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
  if (ms <= 0)            return 'normal'
  if (ms <  5 * 60_000)  return 'critical'
  if (ms < 60 * 60_000)  return 'warning'
  return 'normal'
}

interface Props {
  endDate: string | Date
  showSeconds?: boolean
  className?: string
}

export function AuctionCountdown({ endDate, showSeconds = true, className }: Props) {
  const [left, setLeft] = useState<TimeLeft>(() => compute(endDate))

  useEffect(() => {
    const tick = () => setLeft(compute(endDate))
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [endDate])

  const u = urgency(left.total)

  const underHour = left.days === 0 && left.hours === 0
  const parts: string[] = []
  if (left.days > 0) parts.push(`${left.days}d`)
  if (left.hours > 0 || left.days > 0) parts.push(`${left.hours}t`)
  parts.push(`${left.minutes}m`)
  if (showSeconds && underHour) parts.push(`${String(left.seconds).padStart(2, '0')}s`)

  if (left.total <= 0) {
    return (
      <Badge variant="outline" className={cn('text-muted-foreground', className)}>
        <ClockIcon /> Afsluttet
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'tabular-nums transition-colors duration-700 gap-1',
        u === 'critical' && 'border-red-200 bg-red-50 text-red-700',
        u === 'warning'  && 'border-amber-200 bg-amber-50 text-amber-700',
        u === 'normal'   && 'border-stone-200 bg-stone-50 text-stone-500',
        className,
      )}
    >
      <ClockIcon />
      {parts.join(' ')}
    </Badge>
  )
}

function ClockIcon() {
  return (
    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
