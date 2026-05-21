export interface Car {
  id: string
  ownerId: string
  brand: string
  model: string
  subModel: string | null
  variant: string | null
  bodyType: string | null
  category: string | null
  description: string
  specs: string | null
  condition: string
  km: number
  lastInspectionKm: number | null
  year: number
  power: number
  fuel: string | null
  gearType: string | null
  engineSize: number | null
  seats: number | null
  weight: number | null
  licensePlate: string | null
  use: string | null
  firstRegistration: string | null
  lastInspection: string | null
  nextInspection: string | null
  streetName: string | null
  houseNumber: string | null
  zipcode: string | null
  city: string | null
  images: string[]
  startingPrice: number
  currentPrice: number
  reservePrice: number | null
  auctionEndDate: string
  auctionStartDate: string | null
  status: string
  isDraft: boolean
  winnerBidId: string | null
  vin: string | null
  inspectionReportUrl: string | null
  serviceHistoryUrls: string[]
  bidIncrement: number | null
  antiSnipingMinutes: number
  views: number
  createdAt: string
  updatedAt: string
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
    }
  }>
  _count?: {
    bids: number
  }
}
