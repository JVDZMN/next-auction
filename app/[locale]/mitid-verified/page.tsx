'use client'

import Link from 'next/link'
import { useLocale } from '@/lib/i18n/context'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

const errors: Record<string, string> = {
  missing: 'The verification request was incomplete.',
  invalid_state: 'The verification link is invalid or expired.',
  token_failed: 'MitID could not confirm your identity. Please try again.',
}

function MitIdContent() {
  const locale = useLocale()
  const searchParams = useSearchParams()
  const success = searchParams?.get('status') === 'success'
  const message = success
    ? 'Your identity has been verified with MitID.'
    : (errors[searchParams?.get('reason') ?? ''] ?? 'Something went wrong. Please try again.')

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-2">
            {success
              ? <CheckCircle2 className="h-12 w-12 text-green-600" />
              : <XCircle className="h-12 w-12 text-destructive" />}
          </div>
          <CardTitle className={success ? 'text-green-700' : 'text-destructive'}>
            {success ? 'MitID Verified' : 'Verification Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">{message}</p>
          <Link href={`/${locale}`} className={buttonVariants()}>Go to Home</Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default function MitIdVerifiedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner className="h-6 w-6" /></div>}>
      <MitIdContent />
    </Suspense>
  )
}
