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
