'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { cloudinaryBlurUrl } from '@/lib/cloudinary'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  images: string[]
  alt: string
}

export function CarImageGallery({ images, alt }: Props) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const prev = useCallback(() => setActive(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setActive(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, prev, next])

  if (images.length === 0) {
    return (
      <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground text-sm rounded-lg">
        No images
      </div>
    )
  }

  return (
    <>
      {/* Main image */}
      <div
        className="relative aspect-video bg-stone-100 overflow-hidden rounded-lg cursor-zoom-in"
        onClick={() => setLightbox(true)}
      >
        <Image
          src={images[active]}
          alt={`${alt} — image ${active + 1}`}
          fill
          className="object-cover transition-opacity duration-200"
          priority={active === 0}
          sizes="(min-width: 1280px) 840px, (min-width: 768px) 65vw, 100vw"
          placeholder="blur"
          blurDataURL={cloudinaryBlurUrl(images[active])}
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
        <span className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-0.5 bg-black/30 text-white/80 text-xs rounded pointer-events-none">
          <ZoomIn className="w-3 h-3" /> Zoom
        </span>
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Image ${i + 1}`}
              className={`relative shrink-0 w-16 h-11 rounded overflow-hidden transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                i === active ? 'ring-2 ring-foreground opacity-100' : 'opacity-50 hover:opacity-80'
              }`}
            >
              <Image src={src} alt={`${alt} thumbnail ${i + 1}`} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox — shadcn Dialog */}
      <Dialog open={lightbox} onOpenChange={setLightbox}>
        <DialogContent className="max-w-5xl w-full bg-black/95 border-0 p-0 [&>button]:text-white [&>button]:hover:bg-white/20">
          <div className="relative w-full aspect-video">
            <Image
              src={images[active]}
              alt={`${alt} — image ${active + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Previous"
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Next"
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}

            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm tabular-nums pointer-events-none">
              {active + 1} / {images.length}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function NavButton({ dir, onClick }: { dir: 'prev' | 'next'; onClick: React.MouseEventHandler }) {
  const left = dir === 'prev'
  return (
    <button
      onClick={onClick}
      aria-label={left ? 'Previous' : 'Next'}
      className={`absolute ${left ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-colors`}
    >
      {left ? <ChevronLeft className="w-4 h-4 text-stone-700" /> : <ChevronRight className="w-4 h-4 text-stone-700" />}
    </button>
  )
}
