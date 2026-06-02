'use client'

import { Clock, Shield, Smartphone, Bell } from 'lucide-react'
import { useInView } from '@/lib/use-in-view'

const BOXES = [
  {
    Icon: Clock,
    title: 'Real-time Budgivning',
    desc: 'Bud opdateres øjeblikkeligt',
  },
  {
    Icon: Shield,
    title: 'Sikker Platform',
    desc: 'Verificeret handel',
  },
  {
    Icon: Smartphone,
    title: 'Byd Overalt',
    desc: 'Desktop og mobil',
  },
  {
    Icon: Bell,
    title: 'Auktionsadvarsler',
    desc: 'Gå aldrig glip af en bil',
  },
]

function FeatureBox({
  Icon,
  title,
  desc,
  delay,
}: {
  Icon: React.ElementType
  title: string
  desc: string
  delay: number
}) {
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: '-60px' })

  return (
    <div
      ref={ref}
      className="group relative flex flex-col gap-3 p-7 cursor-default transition-all duration-300 hover:-translate-y-1"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
        borderLeft: '3px solid transparent',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLDivElement).style.borderLeftColor = 'var(--copper)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLDivElement).style.borderLeftColor = 'transparent'
      }}
    >
      <Icon
        className="h-7 w-7 transition-colors duration-200"
        style={{ color: 'var(--copper)' }}
        strokeWidth={1.6}
      />
      <p className="text-base font-black" style={{ color: 'var(--text-light)' }}>
        {title}
      </p>
      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {desc}
      </p>
    </div>
  )
}

export function FeatureBoxesSection() {
  return (
    <section style={{ backgroundColor: 'var(--dark-section)' }}>
      {/* Top separator */}
      <div
        aria-hidden
        className="h-px w-full"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      />
      <div className="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {BOXES.map((box, i) => (
          <FeatureBox key={box.title} {...box} delay={i * 80} />
        ))}
      </div>
    </section>
  )
}
