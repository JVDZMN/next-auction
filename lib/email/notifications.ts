import { sendEmail } from './core'

export async function sendDisputeNotificationEmail({
  to, carTitle, carId, buyerName, reason, isAdmin = false,
}: {
  to: string; carTitle: string; carId: string
  buyerName: string; reason: string; isAdmin?: boolean
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

export async function sendMessageNotification({
  to, senderName, preview, carTitle, carId,
}: { to: string; senderName: string; preview: string; carTitle: string; carId: string }) {
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

export async function sendBusinessSignupNotification({
  adminEmail, companyName, userEmail, cvrNumber,
}: { adminEmail: string; companyName: string; userEmail: string; cvrNumber: string }) {
  return sendEmail({
    to: adminEmail,
    subject: `Ny erhvervskonto-ansøgning: ${companyName}`,
    html: `
      <h2>Ny erhvervskonto venter godkendelse</h2>
      <p><strong>Virksomhed:</strong> ${companyName}</p>
      <p><strong>CVR:</strong> ${cvrNumber}</p>
      <p><strong>Email:</strong> ${userEmail}</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard" style="display:inline-block;padding:10px 20px;background:#c47d3a;color:white;text-decoration:none;border-radius:4px;margin-top:12px">
        Gå til admin
      </a>
    `,
  })
}
