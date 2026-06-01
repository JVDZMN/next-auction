'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { acceptSkatDisclaimer } from '@/app/actions/user'

export function SkatDisclaimerModal({ isOpen, onClose }: { isOpen: boolean; onClose?: () => void }) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  if (!isOpen) return null

  const handleAccept = async () => {
    setIsPending(true)
    setError('')
    
    const result = await acceptSkatDisclaimer()
    if (result.error) {
      setError(result.error)
      setIsPending(false)
    } else {
      setIsPending(false)
      router.refresh() // Refresh the page to dismiss the modal and allow car creation
      if (onClose) onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-gray-900">SKAT Compliance Notice</h2>
        <p className="text-gray-600 mb-4 leading-relaxed">
          Som privatbruger (C2C) bekræfter jeg, at jeg sælger dette køretøj som privatperson, og
          at jeg højst kan sætte 2 biler til salg om året i overensstemmelse med SKATs gældende regler for privat handel.
        </p>
        
        {error && <p className="text-red-600 mb-4 text-sm font-medium">{error}</p>}
        
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={handleAccept}
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 w-full sm:w-auto"
          >
            {isPending ? 'Accepterer...' : 'Jeg accepterer vilkårene'}
          </button>
        </div>
      </div>
    </div>
  )
}