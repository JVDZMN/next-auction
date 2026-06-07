'use client'

import { useState, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { useLocale, useDict } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

type CvrResult = { name: string; city: string; industry: string } | null

interface Props {
  isLoading: boolean
  onSubmit: (data: { name: string; email: string; password: string; cvr: string }) => void
}

export function BusinessSignupForm({ isLoading, onSubmit }: Props) {
  const locale = useLocale()
  const t      = useDict().signup
  const [fields, setFields]           = useState({ name: '', cvr: '', email: '', password: '', confirm: '' })
  const [cvrResult, setCvrResult]     = useState<CvrResult>(null)
  const [cvrError, setCvrError]       = useState('')
  const [lastFetchedCvr, setLastFetchedCvr] = useState<string | null>(null)
  const [localError, setLocalError]   = useState('')

  const cvrIsComplete = fields.cvr.length === 8
  // Loading: 8 digits present but we haven't finished a fetch for this CVR yet
  const cvrLoading = cvrIsComplete && lastFetchedCvr !== fields.cvr && !cvrError

  useEffect(() => {
    if (!cvrIsComplete) return
    let cancelled = false
    fetch(`/api/cvr?cvr=${fields.cvr}`)
      .then(r => r.json())
      .then((data: { name?: string; city?: string; industry?: string; error?: string }) => {
        if (cancelled) return
        setLastFetchedCvr(fields.cvr)
        if (data.error) { setCvrError(t.cvrNotFound); setCvrResult(null) }
        else { setCvrResult({ name: data.name ?? '', city: data.city ?? '', industry: data.industry ?? '' }); setCvrError('') }
      })
      .catch(() => { if (!cancelled) { setLastFetchedCvr(fields.cvr); setCvrError(t.cvrFetchError) } })
    return () => { cancelled = true }
  }, [cvrIsComplete, fields.cvr, t.cvrNotFound, t.cvrFetchError])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLocalError('')
    if (!cvrResult || !cvrIsComplete) { setLocalError(t.errVerifyCvr); return }
    if (fields.password !== fields.confirm) { setLocalError(t.errPasswordMismatch); return }
    if (fields.password.length < 6) { setLocalError(t.errPasswordTooShort); return }
    onSubmit({ name: fields.name || cvrResult.name, email: fields.email, password: fields.password, cvr: fields.cvr })
  }

  return (
    <>
      <Alert style={{ borderColor: 'rgba(180,130,0,0.3)', backgroundColor: 'rgba(255,200,0,0.07)' }}>
        <AlertTriangle className="h-4 w-4" style={{ color: 'rgb(160,110,0)' }} />
        <AlertDescription style={{ color: 'rgb(120,80,0)' }}>{t.bizApprovalWarning}</AlertDescription>
      </Alert>

      {localError && <p className="text-sm text-destructive">{localError}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="biz-cvr">{t.labelCvr}</Label>
          <Input id="biz-cvr" type="text" required inputMode="numeric" maxLength={8} className="h-11 text-base font-mono tracking-widest" placeholder="12345678"
            value={fields.cvr} onChange={e => setFields({ ...fields, cvr: e.target.value.replace(/\D/g, '') })} />
          {cvrIsComplete && cvrLoading && (
            <p className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Spinner className="h-3 w-3" /> {t.cvrLoading}
            </p>
          )}
          {cvrIsComplete && cvrResult && (
            <div className="flex items-center gap-2 rounded-md px-3 py-2 text-xs" style={{ backgroundColor: 'rgba(0,160,60,0.08)', border: '1px solid rgba(0,160,60,0.2)', color: 'rgb(0,120,40)' }}>
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span><strong>{cvrResult.name}</strong> · {cvrResult.city} · {t.cvrActive}</span>
            </div>
          )}
          {cvrIsComplete && cvrError && <p className="text-xs" style={{ color: 'rgb(180,0,0)' }}>{cvrError}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="biz-name">{t.labelCompanyName}</Label>
          <Input id="biz-name" type="text" required className="h-11 text-base" placeholder={cvrResult?.name || t.placeholderCompany}
            value={fields.name} onChange={e => setFields({ ...fields, name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="biz-email">{t.labelEmail}</Label>
          <Input id="biz-email" type="email" required className="h-11 text-base" placeholder={t.placeholderBizEmail}
            value={fields.email} onChange={e => setFields({ ...fields, email: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="biz-pw">{t.labelPassword}</Label>
          <Input id="biz-pw" type="password" required minLength={6} className="h-11 text-base" placeholder="••••••••"
            value={fields.password} onChange={e => setFields({ ...fields, password: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="biz-confirm">{t.labelConfirmPassword}</Label>
          <Input id="biz-confirm" type="password" required minLength={6} className="h-11 text-base" placeholder="••••••••"
            value={fields.confirm} onChange={e => setFields({ ...fields, confirm: e.target.value })} />
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{t.cvrVerifyInfo}</p>

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
  )
}
