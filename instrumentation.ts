export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Capture unhandled errors from all route handlers (App Router).
export const onRequestError = async (
  error: unknown,
  request: { path: string; method: string; headers: Record<string, string> },
  context: { routerKind: string; routePath: string; routeType: string },
) => {
  const { captureRequestError } = await import('@sentry/nextjs')
  captureRequestError(error, request, context)
}
