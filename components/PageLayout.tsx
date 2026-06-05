'use client'

import { Spinner } from '@/components/ui/spinner'

interface Props {
  children: React.ReactNode
  maxWidth?: string
}

export function PageLayout({ children, maxWidth = 'max-w-7xl' }: Props) {
  return (
    <div className="min-h-screen bg-background">
      <main className={`${maxWidth} mx-auto px-4 py-12`}>{children}</main>
    </div>
  )
}

export function LoadingPage({ maxWidth }: { maxWidth?: string }) {
  return (
    <PageLayout maxWidth={maxWidth}>
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Spinner className="h-8 w-8 text-primary" />
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    </PageLayout>
  )
}

export function ErrorPage({ message, maxWidth }: { message: string; maxWidth?: string }) {
  return (
    <PageLayout maxWidth={maxWidth}>
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <p className="text-destructive font-semibold">{message}</p>
        <p className="text-muted-foreground text-sm">Try refreshing the page.</p>
      </div>
    </PageLayout>
  )
}
