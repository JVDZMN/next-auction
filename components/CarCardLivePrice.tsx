'use client'

import { useState, useEffect } from 'react'
import { getPusherClient } from '@/lib/pusher-client'
import { cn } from '@/lib/utils'

interface Props {
  carId: string
  initialPrice: number
  initialBidCount: number
}

export function CarCardLivePrice({ carId, initialPrice, initialBidCount }: Props) {
  const [price,     setPrice]     = useState(initialPrice)
  const [bidCount,  setBidCount]  = useState(initialBidCount)
  const [flashKey,  setFlashKey]  = useState(0)

  useEffect(() => {
    const pusher  = getPusherClient()
    const channel = pusher.subscribe(`private-car-${carId}`)

    channel.bind('bid-placed', (data: { currentPrice: number; bidCount: number }) => {
      setPrice(data.currentPrice)
      setBidCount(data.bidCount)
      setFlashKey(k => k + 1)
    })

    return () => {
      channel.unbind('bid-placed')
      pusher.unsubscribe(`private-car-${carId}`)
    }
  }, [carId])

  return (
    <div className="flex items-end justify-between border-t pt-3 mt-2">
      <div>
        <p className="text-xs text-muted-foreground">Current bid</p>
        <p
          key={flashKey}
          className={cn('text-lg font-bold text-copper', flashKey > 0 && 'price-flash')}
        >
          {price.toLocaleString('da-DK')} kr
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
      </p>
    </div>
  )
}
