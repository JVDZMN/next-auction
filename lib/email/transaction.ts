import { sendEmail } from './core'

export async function sendPaymentConfirmationEmail({
  to, winnerName, carTitle, finalPrice, carId, locale = 'en',
}: {
  to: string; winnerName: string; carTitle: string
  finalPrice: number; carId: string; locale?: string
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
  to, sellerName, carTitle, finalPrice, carId, locale = 'en',
}: {
  to: string; sellerName: string; carTitle: string
  finalPrice: number; carId: string; locale?: string
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
  to, bidderName, carTitle, bidAmount, carId, deadline, locale = 'en',
}: {
  to: string; bidderName: string; carTitle: string
  bidAmount: number; carId: string; deadline: Date; locale?: string
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
        Accept &amp; Pay
      </a>
    `,
  })
}

export async function sendRefundEmail({
  to, buyerName, carTitle, refundAmount,
}: { to: string; buyerName: string; carTitle: string; refundAmount: number }) {
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
