'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageLayout } from '@/components/PageLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ShieldCheck, User, CalendarDays, Trophy } from 'lucide-react'

interface PublicProfile {
  id: string
  name: string
  memberSince: string
  successfulPurchases: number
  verifiedBuyer: boolean
}

export default function BuyerProfilePage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = params instanceof Promise ? use(params) : params

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/users/${id}/profile`)
      .then(r => {
        if (!r.ok) throw new Error(r.status === 404 ? 'User not found' : 'Failed to load profile')
        return r.json()
      })
      .then(setProfile)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <PageLayout maxWidth="max-w-lg">
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <p>{error}</p>
          </CardContent>
        </Card>
      ) : profile && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl">{profile.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">Buyer profile</p>
              </div>
              {profile.verifiedBuyer && (
                <Badge className="gap-1.5 bg-green-600 hover:bg-green-600 text-white shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified Buyer
                </Badge>
              )}
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-5 space-y-5">
            {/* Member since */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted shrink-0">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Member since</p>
                <p className="text-sm font-medium">
                  {new Date(profile.memberSince).toLocaleDateString('da-DK', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Successful purchases */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted shrink-0">
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Successful purchases</p>
                <p className="text-sm font-medium">
                  {profile.successfulPurchases === 0
                    ? 'No completed purchases yet'
                    : `${profile.successfulPurchases} completed auction${profile.successfulPurchases !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            {/* Identity verification */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted shrink-0">
                {profile.verifiedBuyer
                  ? <ShieldCheck className="h-4 w-4 text-green-600" />
                  : <User className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Identity verification</p>
                <p className="text-sm font-medium">
                  {profile.verifiedBuyer ? 'Verified via MitID' : 'Not yet verified'}
                </p>
              </div>
            </div>

            <Separator />

            <p className="text-xs text-muted-foreground leading-relaxed">
              Profile information is limited to public metadata in accordance with GDPR. Contact details and personal information are not shared.
            </p>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  )
}
