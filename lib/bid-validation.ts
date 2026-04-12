export type BidValidationInput = {
  amount: number
  currentPrice: number
  status: string
  auctionEndDate: Date
  ownerId: string
  bidderId: string
}

export type BidValidationResult =
  | { valid: true }
  | { valid: false; error: string; httpStatus: number }

export function validateBid(input: BidValidationInput): BidValidationResult {
  if (input.status !== 'active') {
    return { valid: false, error: 'Auction is not active', httpStatus: 400 }
  }

  if (input.auctionEndDate < new Date()) {
    return { valid: false, error: 'Auction has ended', httpStatus: 400 }
  }

  if (input.amount <= input.currentPrice) {
    return {
      valid: false,
      error: `Bid must be higher than current price: $${input.currentPrice}`,
      httpStatus: 400,
    }
  }

  if (input.ownerId === input.bidderId) {
    return { valid: false, error: 'You cannot bid on your own car', httpStatus: 400 }
  }

  return { valid: true }
}
