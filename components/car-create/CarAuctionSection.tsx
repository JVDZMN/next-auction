'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { MotionInput } from './MotionInput'

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

const shakeTransition = { duration: 0.4, ease: [0.36, 0.07, 0.19, 0.97] } as const

export function CarAuctionSection({ formData, onChange }: Props) {
  const nowIso       = new Date().toISOString().slice(0, 16)
  const dateError    = getDateError(formData.auctionStartDate, formData.auctionEndDate)
  const hasDateError = dateError !== null

  const onChangeInput = onChange as React.ChangeEventHandler<HTMLInputElement>

  return (
    <>
      {/* ── Animated date-error banner with height + shake ─────────────── */}
      <AnimatePresence initial={false}>
        {hasDateError && (
          <motion.div
            key="date-error"
            layout
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{
              opacity: 1,
              height: 'auto',
              marginBottom: 16,
              x: [0, -6, 6, -5, 5, -3, 0],
            }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{
              height:        { type: 'spring', stiffness: 280, damping: 26 },
              opacity:       { duration: 0.18 },
              marginBottom:  { type: 'spring', stiffness: 280, damping: 26 },
              x:             shakeTransition,
            }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
              <motion.span
                animate={{ rotate: [0, -12, 12, -6, 0] }}
                transition={{ delay: 0.12, duration: 0.38 }}
                className="shrink-0 mt-0.5"
              >
                <AlertTriangle className="h-4 w-4" />
              </motion.span>
              {dateError}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Prices ─────────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="startingPrice" className="block text-sm font-medium text-gray-700 mb-1">
            Starting Price (kr)
          </label>
          <MotionInput
            id="startingPrice" name="startingPrice" type="number" required
            value={formData.startingPrice} onChange={onChangeInput}
            placeholder="5000" min="0" step="0.01"
          />
        </div>

        <div>
          <label htmlFor="reservePrice" className="block text-sm font-medium text-gray-700 mb-1">
            Reserve Price (kr, optional)
          </label>
          <MotionInput
            id="reservePrice" name="reservePrice" type="number"
            value={formData.reservePrice} onChange={onChangeInput}
            placeholder="Optional" min="0" step="0.01"
          />
        </div>

        <div>
          <label htmlFor="auctionEndDate" className="block text-sm font-medium text-gray-700 mb-1">
            Auction End Date
          </label>
          <motion.div
            animate={hasDateError ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
            transition={shakeTransition}
          >
            <MotionInput
              id="auctionEndDate" name="auctionEndDate" type="datetime-local" required
              value={formData.auctionEndDate} onChange={onChangeInput}
              min={nowIso} hasError={hasDateError}
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
            animate={hasDateError ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
            transition={shakeTransition}
          >
            <MotionInput
              id="auctionStartDate" name="auctionStartDate" type="datetime-local"
              value={formData.auctionStartDate} onChange={onChangeInput}
              min={nowIso} hasError={hasDateError}
            />
          </motion.div>
        </div>

        <div>
          <label htmlFor="bidIncrement" className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Bid Increment (kr, optional)
          </label>
          <MotionInput
            id="bidIncrement" name="bidIncrement" type="number"
            value={formData.bidIncrement} onChange={onChangeInput}
            placeholder="e.g. 500" min="0" step="0.01"
          />
        </div>
      </div>
    </>
  )
}
