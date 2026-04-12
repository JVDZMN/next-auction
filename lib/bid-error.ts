/**
 * Thrown inside a Prisma transaction for expected business-rule violations.
 * The outer catch block checks `instanceof BidError` and returns the
 * correct HTTP status instead of a generic 500.
 */
export class BidError extends Error {
  constructor(message: string, public readonly httpStatus: number) {
    super(message)
    this.name = 'BidError'
  }
}
