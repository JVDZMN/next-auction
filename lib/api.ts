import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export function serverError(message: string, error?: unknown) {
  logger.error(message, error ?? new Error(message))
  return NextResponse.json({ error: message }, { status: 500 })
}
