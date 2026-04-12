import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  images: {
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

  // Remove the Sentry debug logger from the production bundle.
  disableLogger: true,

  // Route Sentry requests through the app's own domain so browser
  // ad-blockers cannot intercept them.
  tunnelRoute: '/monitoring',

  // Tree-shake Sentry server-side code from client bundles.
  widenClientFileUpload: true,
})
