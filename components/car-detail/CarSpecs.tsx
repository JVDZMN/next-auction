import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuctionCountdown } from '@/components/AuctionCountdown'

interface Props {
  year: number; km: number; power: number; condition: string | null
  fuel: string | null; startingPrice: number; auctionEndDate: string
  bidIncrement?: number | null; status: string
}

export function CarSpecs({ year, km, power, condition, fuel, startingPrice, auctionEndDate, bidIncrement, status }: Props) {
  const specs = [
    { label: 'Year',           value: String(year) },
    { label: 'Kilometers',     value: `${km.toLocaleString()} km` },
    { label: 'Power',          value: `${power} HP` },
    { label: 'Condition',      value: condition },
    { label: 'Fuel',           value: fuel },
    { label: 'Starting Price', value: `${startingPrice.toLocaleString('da-DK')} kr` },
    { label: 'Auction Ends',   value: new Date(auctionEndDate).toLocaleDateString('da-DK') },
    ...(bidIncrement ? [{ label: 'Bid Increment', value: `${bidIncrement.toLocaleString('da-DK')} kr` }] : []),
  ]

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Specifications</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {specs.map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-semibold capitalize text-sm">{value}</p>
            </div>
          ))}
        </div>
        {status === 'active' && (
          <div className="mt-4"><AuctionCountdown endDate={auctionEndDate} /></div>
        )}
      </CardContent>
    </Card>
  )
}
