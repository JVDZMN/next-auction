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
  locale = 'da',
}: {
  to: string
  token: string
  email: string
  locale?: string
}) {
  const base = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const url = `${base}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}&locale=${locale}`
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
  sellerEmail,
}: {
  to: string
  winnerName: string
  carTitle: string
  finalPrice: number
  carId: string
  sellerEmail?: string
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
  outcome: 'completed' | 'cancelled' | 'no_bid' | 'reserve_not_met'
  finalPrice?: number
  winnerName?: string
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

export async function sendPaymentConfirmationEmail({
  to,
  winnerName,
  carTitle,
  finalPrice,
  carId,
  locale = 'en',
}: {
  to: string
  winnerName: string
  carTitle: string
  finalPrice: number
  carId: string
  locale?: string
}) {
  return sendEmail({
    to,
    subject: `Payment confirmed for ${carTitle}`,
    html: `
      <h2>Payment received!</h2>
      <p>Hi ${winnerName},</p>
      <p>Your payment of <strong>${finalPrice.toLocaleString('da-DK')} kr</strong> for <strong>${carTitle}</strong> has been confirmed.</p>
      <p>The seller will be in touch to arrange collection. You have 24 hours to file a dispute if anything is wrong.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/${locale}/cars/${carId}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
        View Listing
      </a>
    `,
  })
}

export async function sendSaleConfirmedSellerEmail({
  to,
  sellerName,
  carTitle,
  finalPrice,
  carId,
  locale = 'en',
}: {
  to: string
  sellerName: string
  carTitle: string
  finalPrice: number
  carId: string
  locale?: string
}) {
  return sendEmail({
    to,
    subject: `Sale confirmed — ${carTitle}`,
    html: `
      <h2>Your sale is confirmed!</h2>
      <p>Hi ${sellerName},</p>
      <p>The buyer's payment for <strong>${carTitle}</strong> (${finalPrice.toLocaleString('da-DK')} kr) has cleared the dispute window and the sale is now confirmed.</p>
      <p>Please arrange delivery or collection with the buyer.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/${locale}/cars/${carId}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
        View Listing
      </a>
    `,
  })
}

export async function sendSecondChanceEmail({
  to,
  bidderName,
  carTitle,
  bidAmount,
  carId,
  deadline,
  locale = 'en',
}: {
  to: string
  bidderName: string
  carTitle: string
  bidAmount: number
  carId: string
  deadline: Date
  locale?: string
}) {
  const deadlineStr = deadline.toLocaleString('da-DK', { dateStyle: 'medium', timeStyle: 'short' })
  return sendEmail({
    to,
    subject: `Second chance offer — ${carTitle}`,
    html: `
      <h2>You have a second chance!</h2>
      <p>Hi ${bidderName},</p>
      <p>The original winner did not complete payment for <strong>${carTitle}</strong>. As the second-highest bidder, you are being offered the car at your bid of <strong>${bidAmount.toLocaleString('da-DK')} kr</strong>.</p>
      <p><strong>You must pay by ${deadlineStr}</strong> to secure the car.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/${locale}/cars/${carId}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
        Accept & Pay
      </a>
    `,
  })
}

export async function sendDisputeNotificationEmail({
  to,
  carTitle,
  carId,
  buyerName,
  reason,
  isAdmin = false,
}: {
  to: string
  carTitle: string
  carId: string
  buyerName: string
  reason: string
  isAdmin?: boolean
}) {
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL}/en/admin/cars/${carId}`
  return sendEmail({
    to,
    subject: `Dispute filed for ${carTitle}`,
    html: `
      <h2>A dispute has been filed</h2>
      <p>${isAdmin ? 'Admin alert:' : 'Hi,'} <strong>${buyerName}</strong> has filed a dispute for <strong>${carTitle}</strong>.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      ${isAdmin ? `<a href="${adminUrl}" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">Review Dispute</a>` : '<p>An admin will review the dispute and contact you shortly.</p>'}
    `,
  })
}

export async function sendRefundEmail({
  to,
  buyerName,
  carTitle,
  refundAmount,
}: {
  to: string
  buyerName: string
  carTitle: string
  refundAmount: number
}) {
  return sendEmail({
    to,
    subject: `Refund issued for ${carTitle}`,
    html: `
      <h2>Your refund has been issued</h2>
      <p>Hi ${buyerName},</p>
      <p>A refund of <strong>${refundAmount.toLocaleString('da-DK')} kr</strong> has been issued for <strong>${carTitle}</strong>.</p>
      <p>It may take 5–10 business days to appear on your statement.</p>
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
