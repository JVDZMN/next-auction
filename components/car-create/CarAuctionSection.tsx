'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

type ChangeHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void

interface Props {
  formData: {
    startingPrice: string
    reservePrice: string
    auctionEndDate: string
    auctionStartDate: string
    bidIncrement: string
  }
  onChange: ChangeHandler
}

function getDateError(startRaw: string, endRaw: string): string | null {
  if (!endRaw) return null

  const end   = new Date(endRaw)
  const start = startRaw ? new Date(startRaw) : new Date()
  const ms    = end.getTime() - start.getTime()

  if (ms <= 0)                   return 'End date must be after the start date.'
  if (ms < 24 * 60 * 60 * 1000) return 'Auction must run for at least 24 hours.'
  return null
}

const inputClass = (hasError: boolean) =>
  `w-full px-3 py-2 text-sm border rounded transition-colors duration-150 text-gray-900
   focus:ring-2 focus:outline-none focus:border-transparent
   ${hasError
     ? 'border-red-400 focus:ring-red-400 bg-red-50'
     : 'border-gray-300 focus:ring-blue-500'}`

export function CarAuctionSection({ formData, onChange }: Props) {
  const nowIso    = new Date().toISOString().slice(0, 16)
  const dateError = getDateError(formData.auctionStartDate, formData.auctionEndDate)
  const hasDateError = dateError !== null

  return (
    <>
      {/* ── Animated date error banner ─────────────────────────────────── */}
      <AnimatePresence>
        {hasDateError && (
          <motion.div
            key="date-error"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{    opacity: 0, y: -8,  scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="flex items-start gap-3 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm"
          >
            <motion.span
              animate={{ rotate: [0, -8, 8, -4, 0] }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            </motion.span>
            {dateError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Prices ─────────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="startingPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Starting Price (kr)
          </label>
          <input
            id="startingPrice" name="startingPrice" type="number" required
            value={formData.startingPrice} onChange={onChange}
            placeholder="5000" min="0" step="0.01"
            className={inputClass(false)}
          />
        </div>

        <div>
          <label htmlFor="reservePrice" className="block text-sm font-medium text-gray-700 mb-1">
            Reserve Price (kr, optional)
          </label>
          <input
            id="reservePrice" name="reservePrice" type="number"
            value={formData.reservePrice} onChange={onChange}
            placeholder="Optional" min="0" step="0.01"
            className={inputClass(false)}
          />
        </div>

        <div>
          <label htmlFor="auctionEndDate" className="block text-sm font-medium text-gray-700 mb-1">
            Auction End Date
          </label>
          <motion.div
            animate={hasDateError ? { x: [0, -4, 4, -2, 0] } : { x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <input
              id="auctionEndDate" name="auctionEndDate" type="datetime-local" required
              value={formData.auctionEndDate} onChange={onChange} min={nowIso}
              className={inputClass(hasDateError)}
            />
          </motion.div>
        </div>
      </div>

      {/* ── Dates + increment ──────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="auctionStartDate" className="block text-sm font-medium text-gray-700 mb-1">
            Auction Start Date (optional)
          </label>
          <motion.div
            animate={hasDateError ? { x: [0, -4, 4, -2, 0] } : { x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <input
              id="auctionStartDate" name="auctionStartDate" type="datetime-local"
              value={formData.auctionStartDate} onChange={onChange} min={nowIso}
              className={inputClass(hasDateError)}
            />
          </motion.div>
        </div>

        <div>
          <label htmlFor="bidIncrement" className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Bid Increment (kr, optional)
          </label>
          <input
            id="bidIncrement" name="bidIncrement" type="number"
            value={formData.bidIncrement} onChange={onChange}
            placeholder="e.g. 500" min="0" step="0.01"
            className={inputClass(false)}
          />
        </div>
      </div>
    </>
  )
}
