'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

interface Props {
  images: string[]
  alt: string
}

export function CarImageGallery({ images, alt }: Props) {
  const [active, setActive]   = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const prev = useCallback(
    () => setActive(i => (i - 1 + images.length) % images.length),
    [images.length],
  )
  const next = useCallback(
    () => setActive(i => (i + 1) % images.length),
    [images.length],
  )

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape')     setLightbox(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, prev, next])

  // Lock body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  if (images.length === 0) {
    return (
      <div className="aspect-video bg-stone-100 flex items-center justify-center text-stone-400 text-sm rounded-lg">
        Ingen billeder
      </div>
    )
  }

  return (
    <>
      {/* ── Main image ──────────────────────────────────────────────── */}
      <div
        className="relative aspect-video bg-stone-100 overflow-hidden rounded-lg cursor-zoom-in"
        onClick={() => setLightbox(true)}
      >
        <Image
          src={images[active]}
          alt={`${alt} — billede ${active + 1}`}
          fill
          className="object-cover transition-opacity duration-200"
          priority={active === 0}
          sizes="(min-width: 1280px) 840px, (min-width: 768px) 65vw, 100vw"
        />

        {images.length > 1 && (
          <>
            <NavButton dir="prev" onClick={e => { e.stopPropagation(); prev() }} />
            <NavButton dir="next" onClick={e => { e.stopPropagation(); next() }} />
          </>
        )}

        <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/40 text-white text-xs rounded tabular-nums pointer-events-none">
          {active + 1} / {images.length}
        </span>

        {/* Zoom hint */}
        <span className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-0.5 bg-black/30 text-white/80 text-xs rounded pointer-events-none">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
          Forstør
        </span>
      </div>

      {/* ── Thumbnail strip ─────────────────────────────────────────── */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Billede ${i + 1}`}
              className={`relative shrink-0 w-16 h-11 rounded overflow-hidden transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
                i === active
                  ? 'ring-2 ring-stone-900 opacity-100'
                  : 'opacity-50 hover:opacity-80'
              }`}
            >
              <Image
                src={src}
                alt={`${alt} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* ── Lightbox ────────────────────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(false)}
            aria-label="Luk"
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image */}
          <div
            className="relative w-full max-w-5xl mx-4 aspect-video"
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={images[active]}
              alt={`${alt} — billede ${active + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />

            {images.length > 1 && (
              <>
                <LightboxNavButton dir="prev" onClick={prev} />
                <LightboxNavButton dir="next" onClick={next} />
              </>
            )}
          </div>

          {/* Counter */}
          <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/50 text-sm tabular-nums pointer-events-none">
            {active + 1} / {images.length}
          </span>
        </div>
      )}
    </>
  )
}

// ── Shared arrow button shapes ───────────────────────────────────────────────

function NavButton({ dir, onClick }: { dir: 'prev' | 'next'; onClick: React.MouseEventHandler }) {
  const left = dir === 'prev'
  return (
    <button
      onClick={onClick}
      aria-label={left ? 'Forrige' : 'Næste'}
      className={`absolute ${left ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-colors`}
    >
      <ChevronIcon left={left} className="w-4 h-4 text-stone-700" />
    </button>
  )
}

function LightboxNavButton({ dir, onClick }: { dir: 'prev' | 'next'; onClick: () => void }) {
  const left = dir === 'prev'
  return (
    <button
      onClick={onClick}
      aria-label={left ? 'Forrige' : 'Næste'}
      className={`absolute ${left ? '-left-14' : '-right-14'} top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors`}
    >
      <ChevronIcon left={left} className="w-5 h-5 text-white" />
    </button>
  )
}

function ChevronIcon({ left, className }: { left: boolean; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={left ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
    </svg>
  )
}
