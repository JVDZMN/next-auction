'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n/context'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LikeButtonProps {
  carId: string
  initialLiked: boolean
}

export function LikeButton({ carId, initialLiked }: LikeButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const locale = useLocale()
  const [liked, setLiked] = useState(initialLiked)
  const [loading, setLoading] = useState(false)

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!session) {
      router.push(`/${locale}/auth/signin`)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/cars/${carId}/like`, { method: liked ? 'DELETE' : 'POST' })
      if (res.ok) setLiked(!liked)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={liked ? 'Remove from favourites' : 'Add to favourites'}
      className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors disabled:opacity-50 shadow-sm"
    >
      <Heart className={cn('h-4 w-4 transition-colors', liked ? 'fill-red-500 text-red-500' : 'text-stone-400')} />
    </button>
  )
}
