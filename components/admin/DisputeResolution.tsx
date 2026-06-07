import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

interface Props {
  carId: string
  disputeReason?: string
  onSuccess: () => void
}

export function DisputeResolution({ carId, disputeReason, onSuccess }: Props) {
  async function handleRefund() {
    if (!confirm('Issue a full refund and relist the car?')) return
    const res = await fetch(`/api/admin/cars/${carId}/refund`, { method: 'POST' })
    if (res.ok) onSuccess()
    else alert('Refund failed')
  }

  async function handleConfirm() {
    if (!confirm('Confirm the sale (dismiss dispute)?')) return
    const res = await fetch(`/api/admin/cars/${carId}/confirm`, { method: 'POST' })
    if (res.ok) onSuccess()
    else alert('Confirmation failed')
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-4 w-4" /> Dispute Filed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            <strong>Reason:</strong> {disputeReason ?? 'No reason provided'}
          </AlertDescription>
        </Alert>
        <div className="flex gap-3">
          <Button variant="destructive" size="sm" onClick={handleRefund}>
            Refund &amp; Relist
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" size="sm" onClick={handleConfirm}>
            Confirm Sale
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
