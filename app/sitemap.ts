import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cars = await prisma.car.findMany({
    where: { status: 'active', isDraft: false },
    select: { id: true, updatedAt: true },
  })

  const carUrls = cars.map(car => ({
    url: `https://next-auction-iota.vercel.app/en/cars/${car.id}`,
    lastModified: car.updatedAt,
  }))

  return [
    { url: 'https://next-auction-iota.vercel.app/en', lastModified: new Date() },
    { url: 'https://next-auction-iota.vercel.app/en/cars', lastModified: new Date() },
    ...carUrls,
  ]
}
