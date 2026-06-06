import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'

interface Props {
  bidAmount: string
  minNextBid: number
  bidIncrement?: number | null
  isEnded: boolean
  error: string | null
  success: string | null
  labels: { placeBid: string; minimumBid: string; increment: string; yourBidLabel: string; submit: string; auctionEnded: string }
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export function PlaceBidForm({ bidAmount, minNextBid, bidIncrement, isEnded, error, success, labels, onChange, onSubmit }: Props) {
  return (
    <div className="rounded-xl border p-5 space-y-4">
      <h3 className="font-semibold">{labels.placeBid}</h3>

      {error   && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800"><CheckCircle2 className="h-4 w-4" /><AlertDescription>{success}</AlertDescription></Alert>}

      <p className="text-xs text-muted-foreground">
        {labels.minimumBid}:{' '}
        <span className="font-semibold text-foreground">{minNextBid.toLocaleString('da-DK')} kr</span>
        {bidIncrement && bidIncrement > 0 && (
          <span className="text-muted-foreground/60"> · {labels.increment}: {bidIncrement.toLocaleString('da-DK')} kr</span>
        )}
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="bidAmount">{labels.yourBidLabel}</Label>
          <Input
            id="bidAmount" type="number" step="1" min={minNextBid}
            value={bidAmount}
            onChange={e => onChange(e.target.value)}
            placeholder={`min. ${minNextBid.toLocaleString('da-DK')} kr`}
            required
          />
        </div>
        {isEnded && (
          <Alert><Info className="h-4 w-4" /><AlertDescription>{labels.auctionEnded}</AlertDescription></Alert>
        )}
        <Button type="submit" className="w-full" disabled={isEnded}>{labels.submit}</Button>
      </form>
    </div>
  )
}
