import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'

interface Props {
  amount: number | null
  isPending: boolean
  labels: { title: string; body: string; yourBidLabel: string; cancel: string; confirm: string; placing: string }
  onConfirm: () => void
  onCancel: () => void
}

export function BidConfirmDialog({ amount, isPending, labels, onConfirm, onCancel }: Props) {
  return (
    <Dialog open={amount !== null} onOpenChange={open => { if (!open) onCancel() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
            {labels.body}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between py-2 border-y">
          <span className="text-sm text-muted-foreground">{labels.yourBidLabel}</span>
          <span className="text-2xl font-bold">{amount?.toLocaleString('da-DK')} kr</span>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>{labels.cancel}</Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? <><Spinner className="mr-2 h-4 w-4" />{labels.placing}</> : labels.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
