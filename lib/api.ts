import { NextResponse } from 'next/server'

export function serverError(message: string, error?: unknown) {
  console.error(message, error)
  return NextResponse.json({ error: message }, { status: 500 })
}
