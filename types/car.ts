export interface Car {
  id: string
  brand: string
  model: string
  description: string
  specs: string | null
  condition: string
  km: number
  year: number
  power: number
  fuel: string
  images: string[]
  startingPrice: number
  currentPrice: number
  reservePrice: number | null
  auctionEndDate: string
  auctionStartDate: string | null
  status: string
  isDraft: boolean
  vin: string | null
  inspectionReportUrl: string | null
  serviceHistoryUrls: string[]
  bidIncrement: number | null
  antiSnipingMinutes: number
  views: number
  createdAt: string
  owner: {
    id: string
    name: string | null
    email: string
    sellerVerified?: boolean
    createdAt?: string
  }
  bids: Array<{
    id: string
    amount: number
    createdAt: string
    bidder: {
      id?: string
      name: string | null
      email?: string
      _count?: {
        bids: number
        cars: number
      }
    }
  }>
}
