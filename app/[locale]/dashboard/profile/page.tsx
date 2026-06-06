"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingPage } from '@/components/PageLayout'

interface DealerProfile {
  dealerDescription: string | null
  dealerLogoUrl:     string | null
  dealerCity:        string | null
  dealerWebsite:     string | null
}

export default function DealerProfileEditPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const locale = useLocale()

  const [form,    setForm]    = useState<DealerProfile>({ dealerDescription: '', dealerLogoUrl: '', dealerCity: '', dealerWebsite: '' })
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') { router.replace(`/${locale}/auth/signin`); return }
    if (status === 'loading') return
    if (session?.user?.role !== 'BUSINESS_USER') { router.replace(`/${locale}/dashboard`); return }

    fetch('/api/user/profile')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setForm({
            dealerDescription: data.user.dealerDescription ?? '',
            dealerLogoUrl:     data.user.dealerLogoUrl ?? '',
            dealerCity:        data.user.dealerCity ?? '',
            dealerWebsite:     data.user.dealerWebsite ?? '',
          })
        }
      })
      .catch(() => setError('Kunne ikke indlæse profil'))
      .finally(() => setLoading(false))
  }, [session, status, locale, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch('/api/user/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Fejl ved gemning')
      setSaved(true)
    } catch {
      setError('Kunne ikke gemme profil')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) return <LoadingPage maxWidth="max-w-2xl" />

  return (
    <div style={{ backgroundColor: 'var(--page-bg)', minHeight: '100vh' }} className="px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href={`/${locale}/dashboard?tab=profile`}
            className="text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-muted)' }}
          >
            ← Min konto
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Rediger virksomhedsprofil</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-body)' }}>
                  Beskrivelse
                </label>
                <textarea
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  style={{ borderColor: 'rgba(0,0,0,0.15)', color: 'var(--text-body)', backgroundColor: 'var(--card-bg)', minHeight: 100 }}
                  placeholder="Fortæl om din virksomhed..."
                  value={form.dealerDescription ?? ''}
                  onChange={e => setForm(f => ({ ...f, dealerDescription: e.target.value }))}
                  maxLength={1000}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-body)' }}>
                  Logo-URL
                </label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={form.dealerLogoUrl ?? ''}
                  onChange={e => setForm(f => ({ ...f, dealerLogoUrl: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-body)' }}>
                  By
                </label>
                <Input
                  type="text"
                  placeholder="København"
                  value={form.dealerCity ?? ''}
                  onChange={e => setForm(f => ({ ...f, dealerCity: e.target.value }))}
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-body)' }}>
                  Hjemmeside
                </label>
                <Input
                  type="url"
                  placeholder="https://dinvirksomhed.dk"
                  value={form.dealerWebsite ?? ''}
                  onChange={e => setForm(f => ({ ...f, dealerWebsite: e.target.value }))}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {saved && <p className="text-sm text-green-600">Profil gemt!</p>}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={saving}
                  style={{ backgroundColor: 'var(--copper)', color: '#fff', minHeight: 44 }}
                >
                  {saving ? 'Gemmer…' : 'Gem profil'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/${locale}/dashboard?tab=profile`)}
                  style={{ minHeight: 44 }}
                >
                  Annuller
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
