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
  status: string
  createdAt: string
  owner: {
    id: string
    name: string | null
    email: string
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
