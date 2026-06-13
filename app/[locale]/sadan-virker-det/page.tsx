import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { toLocale } from '@/lib/i18n'
import { HowItWorksPageClient } from '@/components/HowItWorksPageClient'

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale  = toLocale(rawLocale)
  const session = await getServerSession(authOptions)
  const role    = session?.user?.role as string | undefined

  return (
    <HowItWorksPageClient
      locale={locale}
      isSignedIn={!!session}
      role={role}
    />
  )
}
