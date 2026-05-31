/**
 * Validates required environment variables at startup.
 * Import this module in any server-side entry point (e.g. instrumentation.ts)
 * so misconfigured deployments fail loudly at boot rather than at runtime.
 */

const REQUIRED = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
] as const

const OPTIONAL_WITH_WARNING = [
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'CRON_SECRET',
] as const

function validateEnv() {
  // Only validate server-side secrets when running on the server.
  // Client-side execution (e.g. in the browser) will not have access 
  // to these variables by design.
  if (typeof window !== 'undefined') return

  const missing = REQUIRED.filter((k) => !process.env[k])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join('\n  ')}\n\nCheck your .env file or deployment configuration.`,
    )
  }

  if (process.env.NODE_ENV !== 'test') {
    const warnMissing = OPTIONAL_WITH_WARNING.filter((k) => !process.env[k])
    if (warnMissing.length > 0) {
      console.warn(
        `[env] Optional environment variables not set (some features will be disabled):\n  ${warnMissing.join('\n  ')}`,
      )
    }
  }
}

validateEnv()

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CRON_SECRET: process.env.CRON_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  MOTORAPI_TOKEN: process.env.MOTORAPI_TOKEN,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  CRIIPTO_CLIENT_ID: process.env.CRIIPTO_CLIENT_ID,
  CRIIPTO_CLIENT_SECRET: process.env.CRIIPTO_CLIENT_SECRET,
  CRIIPTO_DOMAIN: process.env.CRIIPTO_DOMAIN,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PUSHER_APP_ID: process.env.PUSHER_APP_ID,
  PUSHER_KEY: process.env.PUSHER_KEY,
  PUSHER_SECRET: process.env.PUSHER_SECRET,
  PUSHER_CLUSTER: process.env.PUSHER_CLUSTER,
  NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
  NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  
} as const
