'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useLocale, useDict } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, CheckCircle2, Building2, User } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { PrivateSignupForm } from '@/components/auth/PrivateSignupForm'
import { BusinessSignupForm } from '@/components/auth/BusinessSignupForm'

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function SignUpContent() {
  const router  = useRouter()
  const locale  = useLocale()
  const t       = useDict().signup
  const params  = useSearchParams()
  const defaultTab = (params.get('tab') === 'business' ? 'business' : 'private') as 'private' | 'business'

  const [tab, setTab]           = useState<'private' | 'business'>(defaultTab)
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  const handlePrivateSubmit = async ({ name, email, password }: { name: string; email: string; password: string }) => {
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, locale, userType: 'PRIVATE_USER', skatDisclaimerAccepted: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t.errCreateFailed)
      router.push(`/${locale}/auth/signin?registered=1`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errGeneric)
    } finally {
      setLoading(false)
    }
  }

  const handleBusinessSubmit = async ({ name, email, password, cvr }: { name: string; email: string; password: string; cvr: string }) => {
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, locale, userType: 'BUSINESS_USER', cvrNumber: cvr }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t.errApplyFailed)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errGeneric)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: 'var(--page-bg)' }}>
        <div className="w-full max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(196,125,58,0.12)' }}>
              <CheckCircle2 className="h-8 w-8" style={{ color: 'var(--copper)' }} />
            </div>
          </div>
          <h1 className="mb-3 text-2xl font-black" style={{ color: 'var(--text-body)' }}>{t.successTitle}</h1>
          <p className="mb-8 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{t.successBody}</p>
          <Link
            href={`/${locale}/auth/signin`}
            className="inline-block rounded px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-85"
            style={{ backgroundColor: 'var(--dark-section)' }}
          >
            {t.successSignIn}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: 'var(--page-bg)' }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href={`/${locale}`} className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-body)' }}>
            Next<span style={{ color: 'var(--copper)' }}>Auction</span>
          </Link>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{t.pageSubtitle}</p>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'white', borderColor: 'rgba(0,0,0,0.08)' }}>
          <div className="p-4 pb-0" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <Tabs value={tab} onValueChange={(v) => { setTab(v as 'private' | 'business'); setError('') }}>
              <TabsList className="w-full grid grid-cols-2 h-11">
                <TabsTrigger value="private" className="gap-2 text-sm font-semibold">
                  <User className="h-4 w-4" /> {t.tabPrivate}
                </TabsTrigger>
                <TabsTrigger value="business" className="gap-2 text-sm font-semibold">
                  <Building2 className="h-4 w-4" /> {t.tabBusiness}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="p-6 space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {tab === 'private' && (
              <PrivateSignupForm isLoading={isLoading} onSubmit={handlePrivateSubmit} />
            )}
            {tab === 'business' && (
              <BusinessSignupForm isLoading={isLoading} onSubmit={handleBusinessSubmit} />
            )}

            <Separator />

            <Button variant="outline" className="w-full h-11 gap-3" disabled={isLoading}
              onClick={() => signIn('google', { callbackUrl: `/${locale}` })}>
              <GoogleIcon /> {t.continueWithGoogle}
            </Button>

            <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              {t.haveAccount}{' '}
              <Link href={`/${locale}/auth/signin`} className="font-medium underline underline-offset-2 hover:opacity-70 transition-opacity" style={{ color: 'var(--text-body)' }}>
                {t.signInLink}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--page-bg)' }}>
        <Spinner className="h-6 w-6" />
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}
