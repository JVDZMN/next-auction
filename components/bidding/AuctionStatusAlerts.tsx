import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'

interface Labels {
  signInRequired: string
  ownerCannotBid: string
  auctionEnded:   string
  status: {
    completed: string; completedBody: string
    reserveNotMet: string; reserveNotMetBody: string
    cancelled: string; cancelledBody: string
  }
}

interface Props {
  status: string
  isAuctionActive: boolean
  isOwner: boolean
  isSessionPresent: boolean
  labels: Labels
}

export function AuctionStatusAlerts({ status, isAuctionActive, isOwner, isSessionPresent, labels }: Props) {
  return (
    <>
      {!isSessionPresent && isAuctionActive && (
        <Alert><Info className="h-4 w-4" /><AlertDescription>{labels.signInRequired}</AlertDescription></Alert>
      )}
      {isOwner && (
        <Alert><Info className="h-4 w-4" /><AlertDescription>{labels.ownerCannotBid}</AlertDescription></Alert>
      )}
      {!isAuctionActive && status === 'active' && (
        <Alert><Info className="h-4 w-4" /><AlertDescription>{labels.auctionEnded}</AlertDescription></Alert>
      )}
      {status === 'completed' && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <span className="font-semibold">{labels.status.completed}</span>
            <p className="text-xs mt-0.5">{labels.status.completedBody}</p>
          </AlertDescription>
        </Alert>
      )}
      {status === 'reserve_not_met' && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-semibold">{labels.status.reserveNotMet}</span>
            <p className="text-xs mt-0.5">{labels.status.reserveNotMetBody}</p>
          </AlertDescription>
        </Alert>
      )}
      {status === 'cancelled' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-semibold">{labels.status.cancelled}</span>
            <p className="text-xs mt-0.5">{labels.status.cancelledBody}</p>
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}
