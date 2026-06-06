import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

interface Props {
  proxyMax: string
  livePrice: number
  minNextBid: number
  isEnded: boolean
  isPending: boolean
  error: string | null
  success: string | null
  labels: { title: string; description: string; placeholder: string; submit: string }
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export function ProxyBidForm({ proxyMax, livePrice, minNextBid, isEnded, isPending, error, success, labels, onChange, onSubmit }: Props) {
  return (
    <div className="rounded-xl border p-5 space-y-3">
      <div>
        <h3 className="font-semibold">{labels.title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{labels.description}</p>
      </div>
      {error   && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800"><CheckCircle2 className="h-4 w-4" /><AlertDescription>{success}</AlertDescription></Alert>}
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input
          type="number" step="1" min={minNextBid}
          value={proxyMax}
          onChange={e => onChange(e.target.value)}
          placeholder={`${labels.placeholder} (> ${livePrice.toLocaleString('da-DK')} kr)`}
          required
        />
        <Button type="submit" variant="secondary" disabled={isPending || isEnded}>
          {isPending ? <Spinner className="h-4 w-4" /> : labels.submit}
        </Button>
      </form>
    </div>
  )
}
