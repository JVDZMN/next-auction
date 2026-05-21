/**
 * Vitest setup for integration tests.
 * Sets dummy env vars so third-party SDK constructors (Resend, Sentry, etc.)
 * don't throw at module load time. The services are never actually called in
 * integration tests — bid-service.ts wraps them in fire-and-forget try/catch.
 */

process.env.RESEND_API_KEY   = process.env.RESEND_API_KEY   ?? 'test_dummy_key'
process.env.EMAIL_FROM        = process.env.EMAIL_FROM        ?? 'test@example.com'
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
process.env.NEXTAUTH_SECRET   = process.env.NEXTAUTH_SECRET   ?? 'test_secret'
process.env.NEXTAUTH_URL      = process.env.NEXTAUTH_URL      ?? 'http://localhost:3000'
