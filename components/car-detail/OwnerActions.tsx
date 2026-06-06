import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Copy, XCircle, CalendarClock } from 'lucide-react'

interface Props {
  carId: string; locale: string
  hasBids: boolean; status: string; isDraft?: boolean
  cancelling: boolean; duplicating: boolean; relisting: boolean
  onCancel:     () => void
  onDuplicate:  () => void
  onRelist:     (endDate: string) => void
}

export function OwnerActions({ carId, locale, hasBids, status, cancelling, duplicating, relisting, onCancel, onDuplicate, onRelist }: Props) {
  const router = useRouter()
  const [showRelistForm, setShowRelistForm] = useState(false)
  const [relistDate,     setRelistDate]     = useState('')

  const canRelist = ['cancelled', 'no_bid', 'reserve_not_met'].includes(status)

  return (
    <div className="space-y-3">
      {canRelist && (
        showRelistForm ? (
          <div className="space-y-3 p-4 border rounded-lg">
            <Label className="text-sm font-medium">New auction end date</Label>
            <Input
              type="datetime-local"
              value={relistDate}
              onChange={e => setRelistDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { onRelist(relistDate); setShowRelistForm(false) }} disabled={relisting || !relistDate}>
                <CalendarClock className="h-4 w-4 mr-1" />
                {relisting ? 'Relisting…' : 'Confirm Relist'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowRelistForm(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowRelistForm(true)}>
            <CalendarClock className="h-4 w-4 mr-1" /> Relist Auction
          </Button>
        )
      )}

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => router.back()}>Back</Button>
        {!hasBids && (
          <Button variant="outline" onClick={() => router.push(`/${locale}/cars/${carId}/edit`)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit Listing
          </Button>
        )}
        <Button variant="secondary" onClick={onDuplicate} disabled={duplicating}>
          <Copy className="h-4 w-4 mr-1" />
          {duplicating ? 'Duplicating…' : 'Duplicate as Draft'}
        </Button>
        {status === 'active' && (
          <Button variant="destructive" onClick={onCancel} disabled={cancelling}>
            <XCircle className="h-4 w-4 mr-1" />
            {cancelling ? 'Cancelling…' : 'Cancel Auction'}
          </Button>
        )}
      </div>
    </div>
  )
}
