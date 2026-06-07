'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useLocale, useDict } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'
import { Info } from 'lucide-react'

interface Props {
  isLoading: boolean
  onSubmit: (data: { name: string; email: string; password: string }) => void
}

export function PrivateSignupForm({ isLoading, onSubmit }: Props) {
  const locale = useLocale()
  const t      = useDict().signup
  const [fields, setFields]       = useState({ name: '', email: '', password: '', confirm: '' })
  const [localError, setLocalError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLocalError('')
    if (fields.password !== fields.confirm) { setLocalError(t.errPasswordMismatch); return }
    if (fields.password.length < 6) { setLocalError(t.errPasswordTooShort); return }
    onSubmit({ name: fields.name, email: fields.email, password: fields.password })
  }

  return (
    <>
      <div
        className="flex gap-3 rounded-lg p-4"
        style={{ backgroundColor: 'rgba(196,125,58,0.07)', border: '1px solid rgba(196,125,58,0.25)' }}
      >
        <Info className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--copper)' }} />
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-body)' }}>
          {t.skatInfoPrefix} <strong>{t.skatInfoHighlight}</strong> {t.skatInfoSuffix}
        </p>
      </div>

      {localError && <p className="text-sm text-destructive">{localError}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="priv-name">{t.labelFullName}</Label>
          <Input id="priv-name" type="text" required className="h-11 text-base" placeholder={t.placeholderName}
            value={fields.name} onChange={e => setFields({ ...fields, name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="priv-email">{t.labelEmail}</Label>
          <Input id="priv-email" type="email" required className="h-11 text-base" placeholder={t.placeholderEmail}
            value={fields.email} onChange={e => setFields({ ...fields, email: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="priv-pw">{t.labelPassword}</Label>
          <Input id="priv-pw" type="password" required minLength={6} className="h-11 text-base" placeholder="••••••••"
            value={fields.password} onChange={e => setFields({ ...fields, password: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="priv-confirm">{t.labelConfirmPassword}</Label>
          <Input id="priv-confirm" type="password" required minLength={6} className="h-11 text-base" placeholder="••••••••"
            value={fields.confirm} onChange={e => setFields({ ...fields, confirm: e.target.value })} />
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
  )
}
