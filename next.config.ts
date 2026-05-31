import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const securityHeaders = [
  { key: 'X-Frame-Options',           value: 'DENY' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://res.cloudinary.com https://*.tile.openstreetmap.org data: blob:",
      "media-src 'self' https://res.cloudinary.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.pusher.com wss://*.pusher.com https://vitals.vercel-insights.com https://api.dataforsyningen.dk",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
}

export default withSentryConfig(nextConfig, {
  // Suppress Sentry CLI output during builds unless there is an error.
  silent: !process.env.CI,

  webpack: { treeshake: { removeDebugLogging: true } },

  // Route Sentry requests through the app's own domain so browser
  // ad-blockers cannot intercept them.
  tunnelRoute: '/monitoring',

  // Tree-shake Sentry server-side code from client bundles.
  widenClientFileUpload: true,
})
