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
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </PageLayout>
  )
}

export function ErrorPage({ message, maxWidth }: { message: string; maxWidth?: string }) {
  return (
    <PageLayout maxWidth={maxWidth}>
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="text-4xl">⚠️</div>
        <p className="text-red-600 font-semibold">{message}</p>
        <p className="text-gray-500 text-sm">Try refreshing the page.</p>
      </div>
    </PageLayout>
  )
}
