import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@auction.com',
      to,
      subject,
      html,
    })
    return { success: true, data }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}

export async function sendBidNotification({
  to,
  carTitle,
  bidAmount,
  carId,
}: {
  to: string
  carTitle: string
  bidAmount: number
  carId: string
}) {
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
  to,
  carTitle,
  newBidAmount,
  carId,
}: {
  to: string
  carTitle: string
  newBidAmount: number
  carId: string
}) {
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

export async function sendVerificationEmail({
  to,
  token,
  email,
}: {
  to: string
  token: string
  email: string
}) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`
  return sendEmail({
    to,
    subject: 'Verify your email – Next Auction',
    html: `
      <h2>Welcome to Next Auction!</h2>
      <p>Please verify your email address by clicking the button below.</p>
      <p>This link expires in 24 hours.</p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
        Verify Email
      </a>
      <p style="margin-top:16px;color:#888;font-size:13px">
        If you did not create an account, you can ignore this email.
      </p>
    `,
  })
}

export async function sendAuctionWonEmail({
  to,
  winnerName,
  carTitle,
  finalPrice,
  carId,
}: {
  to: string
  winnerName: string
  carTitle: string
  finalPrice: number
  carId: string
}) {
  return sendEmail({
    to,
    subject: `Congratulations! You won the auction for ${carTitle}`,
    html: `
      <h2>You won the auction!</h2>
      <p>Hi ${winnerName},</p>
      <p>Your bid of <strong>${finalPrice.toLocaleString()} kr</strong> was the winning bid for <strong>${carTitle}</strong>.</p>
      <p>The seller will be in touch to arrange payment and collection.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/cars/${carId}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
        View Listing
      </a>
    `,
  })
}

export async function sendAuctionClosedSellerEmail({
  to,
  sellerName,
  carTitle,
  carId,
  outcome,
  finalPrice,
  winnerName,
}: {
  to: string
  sellerName: string
  carTitle: string
  carId: string
  outcome: 'completed' | 'cancelled' | 'reserve_not_met'
  finalPrice?: number
  winnerName?: string
}) {
  const subjectMap = {
    completed: `Your auction for ${carTitle} has a winner!`,
    cancelled: `Your auction for ${carTitle} ended with no bids`,
    reserve_not_met: `Your auction for ${carTitle} ended — reserve not met`,
  }

  const bodyMap = {
    completed: `
      <h2>Your auction has sold!</h2>
      <p>Hi ${sellerName},</p>
      <p><strong>${winnerName}</strong> won <strong>${carTitle}</strong> with a bid of <strong>${finalPrice?.toLocaleString()} kr</strong>.</p>
      <p>Please contact the buyer to arrange payment and collection.</p>
    `,
    cancelled: `
      <h2>Auction ended with no bids</h2>
      <p>Hi ${sellerName},</p>
      <p>Your auction for <strong>${carTitle}</strong> ended without receiving any bids.</p>
      <p>You can relist the car at any time.</p>
    `,
    reserve_not_met: `
      <h2>Reserve price not met</h2>
      <p>Hi ${sellerName},</p>
      <p>Your auction for <strong>${carTitle}</strong> ended. The highest bid was <strong>${finalPrice?.toLocaleString()} kr</strong>, which did not meet your reserve price.</p>
      <p>You may contact the highest bidder directly or relist the car.</p>
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

export async function sendMessageNotification({
  to,
  senderName,
  preview,
  carTitle,
  carId,
}: {
  to: string
  senderName: string
  preview: string
  carTitle: string
  carId: string
}) {
  return sendEmail({
    to,
    subject: `New message from ${senderName} about ${carTitle}`,
    html: `
      <h2>New Message</h2>
      <p><strong>${senderName}</strong> sent you a message about <strong>${carTitle}</strong>:</p>
      <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555">${preview}</blockquote>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/cars/${carId}">View Listing</a>
    `,
  })
}
