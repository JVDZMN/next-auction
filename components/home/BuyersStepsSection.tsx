'use client'

import Link from 'next/link'
import { UserPlus, Search, Trophy } from 'lucide-react'
import { useInView } from '@/lib/use-in-view'

const STEPS = [
  {
    num: '01',
    Icon: UserPlus,
    title: 'Opret konto',
    desc: 'Gratis og hurtigt. Klar på 2 minutter.',
  },
  {
    num: '02',
    Icon: Search,
    title: 'Find din bil',
    desc: 'Søg, filtrer og gem favoritter.',
  },
  {
    num: '03',
    Icon: Trophy,
    title: 'Afgiv bud og vind',
    desc: 'Højeste bud ved udløb vinder.',
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
        {/* Number + circle */}
        <p
          className="mb-3 text-4xl font-black leading-none sm:text-center"
          style={{ color: 'var(--copper)', opacity: 0.25 }}
        >
          {num}
        </p>
        <div
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--copper)', opacity: 0.9 }}
        >
          <Icon className="h-7 w-7 text-white" strokeWidth={1.6} />
        </div>
        <p className="mb-1.5 font-black text-base" style={{ color: 'var(--text-body)' }}>
          {title}
        </p>
        <p className="text-sm leading-relaxed max-w-[140px]" style={{ color: 'var(--text-muted)' }}>
          {desc}
        </p>
      </div>

      {/* Dashed connector */}
      {!isLast && (
        <div
          aria-hidden
          className="hidden sm:block absolute top-[4.75rem] left-[calc(50%+2.5rem)] right-[calc(-50%+2.5rem)] h-px"
          style={{ borderTop: '2px dashed var(--copper)', opacity: 0.3 }}
        />
      )}
    </div>
  )
}

interface Props { locale: string }

export function BuyersStepsSection({ locale }: Props) {
  const [headRef, headInView] = useInView<HTMLDivElement>({ rootMargin: '-60px' })

  return (
    <section className="py-20 sm:py-28" style={{ backgroundColor: 'var(--page-bg)' }}>
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
            For Købere
          </p>
          <h2 className="text-3xl font-black sm:text-4xl" style={{ color: 'var(--text-body)' }}>
            Vind din næste bil i 3 trin
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start gap-10 sm:gap-0">
          {STEPS.map((step, i) => (
            <Step key={step.num} {...step} delay={i * 120} isLast={i === STEPS.length - 1} />
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href={`/${locale}/auth/signup`}
            className="inline-block rounded px-7 py-3.5 text-sm font-bold text-white hover:scale-105 active:scale-95 transition-transform duration-150"
            style={{ backgroundColor: 'var(--copper)' }}
          >
            Opret gratis konto →
          </Link>
        </div>
      </div>
    </section>
  )
}
