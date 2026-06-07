import { sendEmail } from './core'

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
