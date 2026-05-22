'use client'

import Link from 'next/link'
import { useLocale } from '@/lib/i18n/context'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'

export default function NotFound() {
  const locale = useLocale()
  return (
    <div className="min-h-screen bg-muted/40 flex flex-col items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-8 space-y-4">
          <p className="text-7xl font-black text-primary">404</p>
          <h1 className="text-2xl font-bold">Page not found</h1>
          <p className="text-muted-foreground text-sm">The page you are looking for does not exist or has been moved.</p>
          <Link href={`/${locale}`} className={buttonVariants()}>Back to home</Link>
        </CardContent>
      </Card>
    </div>
  )
}
