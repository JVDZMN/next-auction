import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { notFound } from 'next/navigation'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { DictionaryProvider } from '@/lib/i18n/context'
import { NotificationProvider } from '@/lib/notification-context'
import { getDictionary, toLocale, locales } from '@/lib/i18n'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { Header } from '@/components/Header'
import { Footer } from '@/components/home/NewsletterAndFooter'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'
import '../globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(toLocale(locale))
  return {
    title: { default: 'Next Auction', template: '%s — Next Auction' },
    description: `${dict.home.hero.subtextLine1} ${dict.home.hero.subtextLine2}`,
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = toLocale(rawLocale)

  if (!locales.includes(locale)) notFound()

  const dict = await getDictionary(locale)

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          <DictionaryProvider locale={locale} dict={dict}>
            <NotificationProvider>
              <TooltipProvider>
                <Header />
                {children}
                <Footer locale={locale} />
                <Toaster richColors position="bottom-center" />
              </TooltipProvider>
            </NotificationProvider>
          </DictionaryProvider>
        </SessionProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
