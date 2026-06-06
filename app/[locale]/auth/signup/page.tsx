'use client'

import { Suspense, useState, useEffect, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useLocale, useDict } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AlertTriangle, CheckCircle2, Info, Building2, User } from 'lucide-react'

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

type CvrResult = { name: string; city: string; industry: string } | null

function SignUpContent() {
  const router   = useRouter()
  const locale   = useLocale()
  const t        = useDict().signup
  const params   = useSearchParams()
  const defaultTab = (params.get('tab') === 'business' ? 'business' : 'private') as 'private' | 'business'

  const [tab, setTab]           = useState<'private' | 'business'>(defaultTab)
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  // Private form
  const [priv, setPriv] = useState({ name: '', email: '', password: '', confirm: '' })

  // Business form
  const [biz, setBiz]           = useState({ name: '', cvr: '', email: '', password: '', confirm: '' })
  const [cvrResult, setCvrResult]   = useState<CvrResult>(null)
  const [cvrLoading, setCvrLoading] = useState(false)
  const [cvrError, setCvrError]     = useState('')

  // CVR auto-lookup when 8 digits typed
  useEffect(() => {
    if (biz.cvr.length !== 8) { setCvrResult(null); setCvrError(''); return }
    let cancelled = false
    setCvrLoading(true)
    setCvrError('')
    fetch(`/api/cvr?cvr=${biz.cvr}`)
      .then(r => r.json())
      .then((data: { name?: string; city?: string; industry?: string; error?: string }) => {
        if (cancelled) return
        if (data.error) { setCvrError(t.cvrNotFound); setCvrResult(null) }
        else { setCvrResult({ name: data.name ?? '', city: data.city ?? '', industry: data.industry ?? '' }); setCvrError('') }
      })
      .catch(() => { if (!cancelled) setCvrError(t.cvrFetchError) })
      .finally(() => { if (!cancelled) setCvrLoading(false) })
    return () => { cancelled = true }
  }, [biz.cvr, t.cvrNotFound, t.cvrFetchError])

  const handlePrivateSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (priv.password !== priv.confirm) { setError(t.errPasswordMismatch); return }
    if (priv.password.length < 6) { setError(t.errPasswordTooShort); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: priv.name, email: priv.email, password: priv.password, locale, userType: 'PRIVATE_USER', skatDisclaimerAccepted: true }),
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

  const handleBusinessSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!cvrResult) { setError(t.errVerifyCvr); return }
    if (biz.password !== biz.confirm) { setError(t.errPasswordMismatch); return }
    if (biz.password.length < 6) { setError(t.errPasswordTooShort); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: biz.name || cvrResult.name, email: biz.email, password: biz.password, locale, userType: 'BUSINESS_USER', cvrNumber: biz.cvr }),
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

  // Business success screen
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
          <p className="mb-8 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {t.successBody}
          </p>
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

        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href={`/${locale}`} className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-body)' }}>
            Next<span style={{ color: 'var(--copper)' }}>Auction</span>
          </Link>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{t.pageSubtitle}</p>
        </div>

        {/* Tab card */}
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'white', borderColor: 'rgba(0,0,0,0.08)' }}>

          {/* Tab header */}
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

            {/* ── PRIVATE TAB ── */}
            {tab === 'private' && (
              <>
                {/* SKAT info */}
                <div
                  className="flex gap-3 rounded-lg p-4"
                  style={{ backgroundColor: 'rgba(196,125,58,0.07)', border: '1px solid rgba(196,125,58,0.25)' }}
                >
                  <Info className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--copper)' }} />
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-body)' }}>
                    {t.skatInfoPrefix} <strong>{t.skatInfoHighlight}</strong> {t.skatInfoSuffix}
                  </p>
                </div>

                <form onSubmit={handlePrivateSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="priv-name">{t.labelFullName}</Label>
                    <Input id="priv-name" type="text" required className="h-11 text-base" placeholder={t.placeholderName}
                      value={priv.name} onChange={e => setPriv({ ...priv, name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="priv-email">{t.labelEmail}</Label>
                    <Input id="priv-email" type="email" required className="h-11 text-base" placeholder={t.placeholderEmail}
                      value={priv.email} onChange={e => setPriv({ ...priv, email: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="priv-pw">{t.labelPassword}</Label>
                    <Input id="priv-pw" type="password" required minLength={6} className="h-11 text-base" placeholder="••••••••"
                      value={priv.password} onChange={e => setPriv({ ...priv, password: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="priv-confirm">{t.labelConfirmPassword}</Label>
                    <Input id="priv-confirm" type="password" required minLength={6} className="h-11 text-base" placeholder="••••••••"
                      value={priv.confirm} onChange={e => setPriv({ ...priv, confirm: e.target.value })} />
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    <Checkbox id="priv-terms" required className="mt-0.5 shrink-0" />
                    <Label htmlFor="priv-terms" className="text-sm leading-relaxed cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                      {t.termsPrefix}{' '}
                      <Link href={`/${locale}/terms`} target="_blank" className="underline underline-offset-2" style={{ color: 'var(--text-body)' }}>{t.termsLink}</Link>
                      {' '}{t.termsConjunction}{' '}
                      <Link href={`/${locale}/privacy`} target="_blank" className="underline underline-offset-2" style={{ color: 'var(--text-body)' }}>{t.privacyLink}</Link>
                    </Label>
                  </div>

                  <Button type="submit" className="w-full h-11 text-sm font-bold text-white" disabled={isLoading}
                    style={{ backgroundColor: 'var(--copper)' }}>
                    {isLoading ? <><Spinner className="mr-2 h-4 w-4" />{t.btnCreating}</> : t.btnCreatePrivate}
                  </Button>
                </form>
              </>
            )}

            {/* ── BUSINESS TAB ── */}
            {tab === 'business' && (
              <>
                <Alert style={{ borderColor: 'rgba(180,130,0,0.3)', backgroundColor: 'rgba(255,200,0,0.07)' }}>
                  <AlertTriangle className="h-4 w-4" style={{ color: 'rgb(160,110,0)' }} />
                  <AlertDescription style={{ color: 'rgb(120,80,0)' }}>
                    {t.bizApprovalWarning}
                  </AlertDescription>
                </Alert>

                <form onSubmit={handleBusinessSubmit} className="space-y-4">
                  {/* CVR field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="biz-cvr">{t.labelCvr}</Label>
                    <Input id="biz-cvr" type="text" required inputMode="numeric" maxLength={8} className="h-11 text-base font-mono tracking-widest" placeholder="12345678"
                      value={biz.cvr} onChange={e => setBiz({ ...biz, cvr: e.target.value.replace(/\D/g, '') })} />
                    {cvrLoading && (
                      <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Spinner className="h-3 w-3" /> {t.cvrLoading}
                      </p>
                    )}
                    {cvrResult && (
                      <div className="flex items-center gap-2 rounded-md px-3 py-2 text-xs" style={{ backgroundColor: 'rgba(0,160,60,0.08)', border: '1px solid rgba(0,160,60,0.2)', color: 'rgb(0,120,40)' }}>
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span><strong>{cvrResult.name}</strong> · {cvrResult.city} · {t.cvrActive}</span>
                      </div>
                    )}
                    {cvrError && (
                      <p className="text-xs" style={{ color: 'rgb(180,0,0)' }}>{cvrError}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="biz-name">{t.labelCompanyName}</Label>
                    <Input id="biz-name" type="text" required className="h-11 text-base" placeholder={cvrResult?.name || t.placeholderCompany}
                      value={biz.name} onChange={e => setBiz({ ...biz, name: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="biz-email">{t.labelEmail}</Label>
                    <Input id="biz-email" type="email" required className="h-11 text-base" placeholder={t.placeholderBizEmail}
                      value={biz.email} onChange={e => setBiz({ ...biz, email: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="biz-pw">{t.labelPassword}</Label>
                    <Input id="biz-pw" type="password" required minLength={6} className="h-11 text-base" placeholder="••••••••"
                      value={biz.password} onChange={e => setBiz({ ...biz, password: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="biz-confirm">{t.labelConfirmPassword}</Label>
                    <Input id="biz-confirm" type="password" required minLength={6} className="h-11 text-base" placeholder="••••••••"
                      value={biz.confirm} onChange={e => setBiz({ ...biz, confirm: e.target.value })} />
                  </div>

                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {t.cvrVerifyInfo}
                  </p>

                  <div className="flex items-start gap-2.5 pt-1">
                    <Checkbox id="biz-terms" required className="mt-0.5 shrink-0" />
                    <Label htmlFor="biz-terms" className="text-sm leading-relaxed cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                      {t.termsPrefix}{' '}
                      <Link href={`/${locale}/terms`} target="_blank" className="underline underline-offset-2" style={{ color: 'var(--text-body)' }}>{t.termsLink}</Link>
                      {' '}{t.termsConjunction}{' '}
                      <Link href={`/${locale}/privacy`} target="_blank" className="underline underline-offset-2" style={{ color: 'var(--text-body)' }}>{t.privacyLink}</Link>
                    </Label>
                  </div>

                  <Button type="submit" className="w-full h-11 text-sm font-bold text-white" disabled={isLoading}
                    style={{ backgroundColor: 'var(--dark-section)' }}>
                    {isLoading ? <><Spinner className="mr-2 h-4 w-4" />{t.btnSending}</> : t.btnApplyBusiness}
                  </Button>
                </form>
              </>
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
