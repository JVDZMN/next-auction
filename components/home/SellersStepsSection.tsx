'use client'

import Link from 'next/link'
import { Car, DollarSign, TrendingUp } from 'lucide-react'
import { useInView } from '@/lib/use-in-view'

const STEPS = [
  {
    num: '01',
    Icon: Car,
    title: 'Opret annonce',
    desc: 'Upload billeder og detaljer. Gratis.',
  },
  {
    num: '02',
    Icon: DollarSign,
    title: 'Sæt reservepris',
    desc: 'Sælg kun til en pris du accepterer.',
  },
  {
    num: '03',
    Icon: TrendingUp,
    title: 'Lad buddene komme',
    desc: 'Auktionen arbejder for dig døgnet rundt.',
  },
]

function Step({
  num,
  Icon,
  title,
  desc,
  delay,
  isLast,
}: {
  num: string
  Icon: React.ElementType
  title: string
  desc: string
  delay: number
  isLast: boolean
}) {
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: '-60px' })

  return (
    <div className="flex items-start sm:flex-col sm:items-center sm:text-center flex-1 gap-5 sm:gap-0 relative">
      <div
        ref={ref}
        className="flex flex-col sm:items-center"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(20px)',
          transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
        }}
      >
        <p
          className="mb-3 text-4xl font-black leading-none sm:text-center"
          style={{ color: 'var(--copper)', opacity: 0.3 }}
        >
          {num}
        </p>
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2"
          style={{ borderColor: 'var(--copper)', backgroundColor: 'transparent' }}
        >
          <Icon className="h-7 w-7" style={{ color: 'var(--copper)' }} strokeWidth={1.6} />
        </div>
        <p className="mb-1.5 font-black text-base" style={{ color: 'var(--text-light)' }}>
          {title}
        </p>
        <p className="text-sm leading-relaxed max-w-[140px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {desc}
        </p>
      </div>

      {!isLast && (
        <div
          aria-hidden
          className="hidden sm:block absolute top-[4.75rem] left-[calc(50%+2.5rem)] right-[calc(-50%+2.5rem)] h-px"
          style={{ borderTop: '2px dashed var(--copper)', opacity: 0.25 }}
        />
      )}
    </div>
  )
}

interface Props { locale: string }

export function SellersStepsSection({ locale }: Props) {
  const [headRef, headInView] = useInView<HTMLDivElement>({ rootMargin: '-60px' })

  return (
    <section className="py-20 sm:py-28" style={{ backgroundColor: 'var(--dark-section)' }}>
      <div className="mx-auto max-w-5xl px-6 sm:px-10">
        <div
          ref={headRef}
          className="mb-16 text-center"
          style={{
            opacity: headInView ? 1 : 0,
            transform: headInView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.55s ease, transform 0.55s ease',
          }}
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: 'var(--copper)' }}>
            For Sælgere
          </p>
          <h2 className="text-3xl font-black sm:text-4xl" style={{ color: 'var(--text-light)' }}>
            Sælg din bil til den rigtige pris
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start gap-10 sm:gap-0">
          {STEPS.map((step, i) => (
            <Step key={step.num} {...step} delay={i * 120} isLast={i === STEPS.length - 1} />
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href={`/${locale}/cars/create`}
            className="inline-block rounded px-7 py-3.5 text-sm font-bold text-white hover:scale-105 active:scale-95 transition-transform duration-150"
            style={{ backgroundColor: 'var(--copper)' }}
          >
            Opret annonce →
          </Link>
        </div>
      </div>
    </section>
  )
}
