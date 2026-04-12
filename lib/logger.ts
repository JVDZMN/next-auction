/**
 * Structured logger for server-side API routes.
 *
 * Every call emits a JSON line to stdout so log aggregators (Logtail,
 * Datadog, CloudWatch, etc.) can parse fields without regex.
 *
 * Sentry integration:
 *  - info / warn  →  breadcrumb  (attached to the next error event)
 *  - error        →  captureException  (creates a Sentry issue)
 *  - warn with severity 'abuse'  →  captureMessage  (rate-limit hits worth
 *    tracking as potential bot/abuse activity)
 */

import * as Sentry from '@sentry/nextjs'

type Level = 'info' | 'warn' | 'error'

interface LogEntry extends Record<string, unknown> {
  level: Level
  message: string
  timestamp: string
}

// ── Bid-specific context shapes ──────────────────────────────────────────────

export interface BidAttemptedCtx {
  action: 'bid.attempted'
  userId: string
  carId: string
  amount: number
}

export interface BidPlacedCtx {
  action: 'bid.placed'
  userId: string
  carId: string
  amount: number
}

export interface BidRejectedCtx {
  action: 'bid.rejected'
  userId: string
  carId: string
  amount: number
  /** Human-readable reason returned to the caller. */
  reason: string
  /** HTTP status that was (or will be) returned. */
  httpStatus: number
}

export interface BidRateLimitedCtx {
  action: 'bid.rate_limited'
  userId: string
}

export interface BidFailedCtx {
  action: 'bid.failed'
  userId: string
  carId?: string
  amount?: number
}

// ── Core write ────────────────────────────────────────────────────────────────

function write(entry: LogEntry) {
  const line = JSON.stringify(entry)
  if (entry.level === 'error') {
    process.stderr.write(line + '\n')
  } else {
    process.stdout.write(line + '\n')
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context,
    }
    write(entry)
    Sentry.addBreadcrumb({ level: 'info', message, data: context })
  },

  warn(message: string, context?: Record<string, unknown>, opts?: { abuse?: boolean }) {
    const entry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...context,
    }
    write(entry)
    Sentry.addBreadcrumb({ level: 'warning', message, data: context })

    // Rate-limit hits and other abuse signals are worth their own Sentry event
    // so you can alert on them and correlate with user IDs.
    if (opts?.abuse) {
      Sentry.withScope((scope) => {
        if (context?.userId) scope.setUser({ id: String(context.userId) })
        if (context) scope.setContext('details', context)
        Sentry.captureMessage(message, 'warning')
      })
    }
  },

  error(message: string, error: unknown, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      ...context,
    }
    write(entry)
    Sentry.withScope((scope) => {
      if (context?.userId) scope.setUser({ id: String(context.userId) })
      if (context) scope.setContext('details', context)
      scope.captureException(error instanceof Error ? error : new Error(String(error)))
    })
  },

  // ── Bid-specific helpers ────────────────────────────────────────────────────

  bid: {
    attempted(ctx: Omit<BidAttemptedCtx, 'action'>) {
      logger.info('User attempted to place a bid', { action: 'bid.attempted', ...ctx })
    },

    placed(ctx: Omit<BidPlacedCtx, 'action'>) {
      logger.info('Bid placed successfully', { action: 'bid.placed', ...ctx })
    },

    rejected(ctx: Omit<BidRejectedCtx, 'action'>) {
      logger.warn(
        `Bid rejected — userId=${ctx.userId} amount=${ctx.amount} carId=${ctx.carId} reason="${ctx.reason}"`,
        { action: 'bid.rejected', ...ctx },
      )
    },

    rateLimited(ctx: Omit<BidRateLimitedCtx, 'action'>) {
      logger.warn(
        `Bid rate-limited — userId=${ctx.userId}`,
        { action: 'bid.rate_limited', ...ctx },
        { abuse: true }, // send to Sentry for abuse monitoring
      )
    },

    failed(error: unknown, ctx: Omit<BidFailedCtx, 'action'>) {
      logger.error(
        `Bid failed unexpectedly — userId=${ctx.userId} carId=${ctx.carId ?? '?'} amount=${ctx.amount ?? '?'}`,
        error,
        { action: 'bid.failed', ...ctx },
      )
    },
  },
}
