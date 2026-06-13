import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CarImageGallery } from '@/components/CarImageGallery'
import { PriceDisplay } from '@/components/PriceDisplay'
import { BadgeCheck, Eye } from 'lucide-react'

const statusVariant: Record<string, string> = {
  active:          'bg-green-100 text-green-800 border-green-200',
  pending_payment: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed:       'bg-blue-100 text-blue-800 border-blue-200',
  confirmed:       'bg-emerald-100 text-emerald-800 border-emerald-200',
  payment_overdue: 'bg-orange-100 text-orange-800 border-orange-200',
  second_chance:   'bg-purple-100 text-purple-800 border-purple-200',
  disputed:        'bg-red-100 text-red-800 border-red-200',
  cancelled:       'bg-red-100 text-red-800 border-red-200',
  no_bid:          'bg-gray-100 text-gray-600 border-gray-200',
  reserve_not_met: 'bg-amber-100 text-amber-800 border-amber-200',
  relisted:        'bg-sky-100 text-sky-800 border-sky-200',
}

interface Props {
  brand: string; model: string; year: number; status: string
  images: string[]; imageMetas?: Array<{ url: string; category: string }> | null
  currentPrice: number; views: number
  ownerName: string | null; ownerVerified: boolean
  isOwner: boolean; isDraft: boolean
  onPublish: () => void
}

export function CarHeader({ brand, model, year, status, images, imageMetas, currentPrice, views, ownerName, ownerVerified, isOwner, isDraft, onPublish }: Props) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 pb-0">
        <CarImageGallery images={images} imageMetas={imageMetas} alt={`${year} ${brand} ${model}`} />
      </CardContent>
      <CardContent className="pt-4 pb-6">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">{year} {brand} {model}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-muted-foreground text-sm">Listed by {ownerName}</p>
              {ownerVerified && (
                <Badge variant="secondary" className="gap-1"><BadgeCheck className="h-3 w-3" /> Verified Seller</Badge>
              )}
              {isOwner && (
                <Badge variant="outline" className="gap-1"><Eye className="h-3 w-3" /> {views} view{views !== 1 ? 's' : ''}</Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <PriceDisplay price={currentPrice} label="Aktuel pris" size="lg" />
            <Badge variant="outline" className={`mt-1 ${statusVariant[status] ?? ''}`}>{status}</Badge>
          </div>
        </div>

        {isOwner && isDraft && (
          <Alert className="mt-4 border-amber-200 bg-amber-50 text-amber-800">
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>This listing is a draft and not visible to other users.</span>
              <Button size="sm" onClick={onPublish}>Publish</Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
