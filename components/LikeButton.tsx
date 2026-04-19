'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface LikeButtonProps {
  carId: string
  initialLiked: boolean
}

export function LikeButton({ carId, initialLiked }: LikeButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [liked, setLiked] = useState(initialLiked)
  const [loading, setLoading] = useState(false)

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!session) {
      router.push('/auth/signin')
      return
    }

    setLoading(true)
    try {
      const method = liked ? 'DELETE' : 'POST'
      const res = await fetch(`/api/cars/${carId}/like`, { method })
      if (res.ok) {
        setLiked(!liked)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={liked ? 'Unlike' : 'Like'}
      className={`flex items-center justify-center w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full transition-all hover:scale-110 disabled:opacity-60 ${loading ? 'cursor-wait' : 'cursor-pointer'}`}
    >
      <svg
        className={`w-4 h-4 transition-colors ${liked ? 'text-red-500' : 'text-gray-400'}`}
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  )
}
