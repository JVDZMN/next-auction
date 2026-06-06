import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Props {
  name: string | null
  email: string
  image?: string | null
  role: string
  createdAt: string
  carsListedThisYear: number
}

export function ProfileCard({ name, email, image, role, createdAt, carsListedThisYear }: Props) {
  const isPrivate  = role === 'PRIVATE_USER'
  const isBusiness = role === 'BUSINESS_USER'
  const initials   = (name ?? email).slice(0, 2).toUpperCase()

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={image ?? undefined} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{name || email}</h2>
            <p className="text-sm text-muted-foreground">{email}</p>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              <Badge variant="secondary">{role}</Badge>
              {isPrivate  && <Badge variant="outline" style={{ borderColor: 'var(--copper)', color: 'var(--copper)' }}>Privat</Badge>}
              {isBusiness && <Badge variant="outline" style={{ borderColor: 'var(--brand)',  color: 'var(--brand)'  }}>Erhverv</Badge>}
              <Badge variant="outline">Tilmeldt {new Date(createdAt).toLocaleDateString('da-DK')}</Badge>
            </div>
            {isPrivate && (
              <p className="mt-2 text-xs" style={{ color: carsListedThisYear >= 2 ? 'red' : 'var(--text-muted)' }}>
                Biler oprettet dette år: <strong>{carsListedThisYear} / 2</strong>
                {carsListedThisYear >= 2 && ' — SKAT-grænse nået'}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
