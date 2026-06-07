import { sendEmail } from './core'

export async function sendBidNotification({
  to, carTitle, bidAmount, carId,
}: { to: string; carTitle: string; bidAmount: number; carId: string }) {
  return sendEmail({
    to,
    subject: `New bid on ${carTitle}`,
    html: `
      <h2>New Bid Alert</h2>
      <p>A new bid of ${bidAmount} kr has been placed on your car: ${carTitle}</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/cars/${carId}">View Auction</a>
    `,
  })
}

export async function sendOutbidNotification({
  to, carTitle, newBidAmount, carId,
}: { to: string; carTitle: string; newBidAmount: number; carId: string }) {
  return sendEmail({
    to,
    subject: `You've been outbid on ${carTitle}`,
    html: `
      <h2>Outbid Alert</h2>
      <p>Someone has placed a higher bid of ${newBidAmount} kr on: ${carTitle}</p>
      <p>Place a new bid to stay in the auction!</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/cars/${carId}">View Auction</a>
    `,
  })
}

export async function sendAuctionWonEmail({
  to, winnerName, carTitle, finalPrice, carId, sellerEmail,
}: {
  to: string; winnerName: string; carTitle: string; finalPrice: number
  carId: string; sellerEmail?: string
}) {
  const listingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/en/cars/${carId}`
  return sendEmail({
    to,
    subject: `You won the auction — ${carTitle}`,
    html: `
      <h2>Congratulations! You won the auction.</h2>
      <p>Hi ${winnerName},</p>
      <p>You placed the highest bid of <strong>${finalPrice.toLocaleString('da-DK')} kr</strong> for <strong>${carTitle}</strong>.</p>
      <p>The seller will contact you within 48 hours to arrange viewing and transfer.</p>
      ${sellerEmail ? `<p><strong>Seller contact:</strong> ${sellerEmail}</p>` : ''}
      <a href="${listingUrl}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
        View Listing
      </a>
    `,
  })
}

export async function sendAuctionClosedSellerEmail({
  to, sellerName, carTitle, carId, outcome, finalPrice, winnerName, winnerEmail: _winnerEmail,
}: {
  to: string; sellerName: string; carTitle: string; carId: string
  outcome: 'completed' | 'cancelled' | 'no_bid' | 'reserve_not_met'
  finalPrice?: number; winnerName?: string; winnerEmail?: string
}) {
  const subjectMap = {
    completed:       `Your auction for ${carTitle} has a winner!`,
    cancelled:       `Your auction for ${carTitle} was cancelled`,
    no_bid:          `Your auction for ${carTitle} ended with no bids`,
    reserve_not_met: `Your auction for ${carTitle} ended — reserve not met`,
  }

  const bodyMap = {
    completed: `
      <h2>Your auction has sold!</h2>
      <p>Hi ${sellerName},</p>
      <p><strong>${winnerName}</strong> won <strong>${carTitle}</strong> with a bid of <strong>${finalPrice?.toLocaleString('da-DK')} kr</strong>.</p>
      <p>The buyer has been asked to pay within 48 hours. You will be notified once payment is confirmed.</p>
    `,
    cancelled: `
      <h2>Auction cancelled</h2>
      <p>Hi ${sellerName},</p>
      <p>Your auction for <strong>${carTitle}</strong> was cancelled.</p>
      <p>You can relist the car at any time.</p>
    `,
    no_bid: `
      <h2>Auction ended with no bids</h2>
      <p>Hi ${sellerName},</p>
      <p>Your auction for <strong>${carTitle}</strong> ended without receiving any bids.</p>
      <p>You can relist the car at any time.</p>
    `,
    reserve_not_met: `
      <h2>Reserve price not met</h2>
      <p>Hi ${sellerName},</p>
      <p>Your auction for <strong>${carTitle}</strong> ended. The highest bid was <strong>${finalPrice?.toLocaleString('da-DK')} kr</strong>, which did not meet your reserve price.</p>
      <p>You may accept the highest bid or relist the car.</p>
    `,
  }

  return sendEmail({
    to,
    subject: subjectMap[outcome],
    html: `
      ${bodyMap[outcome]}
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/cars/${carId}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
        View Listing
      </a>
    `,
  })
}
