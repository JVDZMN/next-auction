'use client'

import { Header } from '@/components/Header'

interface Props {
  children: React.ReactNode
  maxWidth?: string
}

export function PageLayout({ children, maxWidth = 'max-w-7xl' }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className={`${maxWidth} mx-auto px-4 py-12`}>
        {children}
      </main>
    </div>
  )
}

export function LoadingPage({ maxWidth }: { maxWidth?: string }) {
  return (
    <PageLayout maxWidth={maxWidth}>
      <div className="text-center">Loading...</div>
    </PageLayout>
  )
}

export function ErrorPage({ message, maxWidth }: { message: string; maxWidth?: string }) {
  return (
    <PageLayout maxWidth={maxWidth}>
      <div className="text-center text-red-600">{message}</div>
    </PageLayout>
  )
}
