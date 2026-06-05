import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const cvr = request.nextUrl.searchParams.get('cvr')

  if (!cvr || !/^\d{8}$/.test(cvr)) {
    return NextResponse.json({ error: 'CVR-nummer skal være præcis 8 cifre' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://cvrapi.dk/api?search=${cvr}&country=dk`,
      {
        headers: { 'User-Agent': 'NextAuction/1.0 (+support@next-auction.dk)' },
        next: { revalidate: 3600 },
      }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'CVR ikke fundet' }, { status: 404 })
    }

    const data = await res.json() as {
      error?: string
      name?: string
      city?: string
      industrydesc?: string
      owners?: { name?: string }[]
    }

    if (data.error) {
      return NextResponse.json({ error: 'Virksomhed ikke fundet' }, { status: 404 })
    }

    return NextResponse.json({
      name:     data.name ?? 'Ukendt virksomhed',
      city:     data.city ?? '',
      industry: data.industrydesc ?? '',
    })
  } catch {
    return NextResponse.json({ error: 'Kunne ikke kontakte CVR-registret' }, { status: 502 })
  }
}
