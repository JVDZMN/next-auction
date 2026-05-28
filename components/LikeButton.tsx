'use client'

import { useState, useTransition } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/lib/i18n/context'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toggleLike } from '@/app/actions/cars'

interface LikeButtonProps {
  carId: string
  initialLiked: boolean
}

export function LikeButton({ carId, initialLiked }: LikeButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const locale = useLocale()
  const [liked, setLiked] = useState(initialLiked)
  const [isPending, startTransition] = useTransition()

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!session) {
      router.push(`/${locale}/auth/signin`)
      return
    }
    const optimistic = !liked
    setLiked(optimistic)
    startTransition(async () => {
      const result = await toggleLike(carId, liked)
      if ('error' in result) setLiked(liked) // revert on error
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-label={liked ? 'Remove from favourites' : 'Add to favourites'}
      className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors disabled:opacity-50 shadow-sm"
    >
      <Heart className={cn('h-4 w-4 transition-colors', liked ? 'fill-red-500 text-red-500' : 'text-stone-400')} />
    </button>
  )
}
