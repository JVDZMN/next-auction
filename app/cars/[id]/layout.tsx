import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  const car = await prisma.car.findUnique({
    where: { id },
    select: {
      brand: true,
      model: true,
      year: true,
      currentPrice: true,
      images: true,
      description: true,
      city: true,
    },
  })

  if (!car) {
    return { title: 'Car not found — Next Auction' }
  }

  const title = `${car.year} ${car.brand} ${car.model}`
  const description = car.description.slice(0, 155)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const image = car.images[0]

  return {
    title: `${title} — Next Auction`,
    description,
    openGraph: {
      title,
      description,
      url: `${appUrl}/cars/${id}`,
      siteName: 'Next Auction',
      type: 'website',
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default function CarDetailLayout({ children }: { children: React.ReactNode }) {
  return children
}
