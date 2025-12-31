import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function getActiveCars() {
  const cars = await prisma.car.findMany({
    where: { status: 'active', auctionEndDate: { gte: new Date() } },
    include: {
      owner: { select: { name: true, rating: true } },
      bids: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { bids: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })
  return cars
}

function getTimeRemaining(endDate: Date) {
  const diff = endDate.getTime() - new Date().getTime()
  if (diff <= 0) return 'Auction ended'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return days > 0 ? `${days}d ${hours}h remaining` : `${hours}h remaining`
}

export default async function HomePage() {
  const cars = await getActiveCars()
  const session = await getServerSession(authOptions)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-linear-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-5xl font-bold mb-6">Buy Your Dream Car</h1>
          <p className="text-xl mb-8">
            Real-time bidding • Verified sellers • Secure transactions
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/cars"
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Browse Auctions
            </Link>
            <Link
              href={session ? "/cars/create" : "/auth/signin"}
              className="px-8 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors border-2 border-white"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </div>

      {/* Active Auctions */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Active Auctions
            {cars.length > 0 && (
              <span className="ml-3 text-gray-500 text-2xl">
                ({cars.length})
              </span>
            )}
          </h2>
          <Link
            href="/cars"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View all →
          </Link>
        </div>

        {cars.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No active auctions at the moment.</p>
            <p className="text-gray-400 mt-2">Check back soon for new listings!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((car) => (
              <Link
                key={car.id}
                href={`/cars/${car.id}`}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden"
              >
                <div className="relative h-48 bg-gray-200">
                  {car.images?.[0] ? (
                    <Image
                      src={car.images[0]}
                      alt={`${car.year} ${car.brand} ${car.model}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No image
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold">
                    {car.condition}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold mb-2 line-clamp-1">
                    {car.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    By {car.owner.name}
                    {car.owner.rating > 0 && (
                      <span className="ml-2 text-yellow-500">
                        ★ {car.owner.rating.toFixed(1)}
                      </span>
                    )}
                  </p>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Current Bid</span>
                      <span className="text-xl font-bold text-blue-600">
                        ${car.currentPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{car._count.bids} bids</span>
                      <span>{getTimeRemaining(car.auctionEndDate)}</span>
                    </div>
                  </div>
                  <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    View & Bid
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Features Section */}
      <section className="bg-white py-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Next Auction?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Bidding</h3>
              <p className="text-gray-600">Place bids instantly with live updates and notifications</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Sellers</h3>
              <p className="text-gray-600">All sellers are verified with rating system</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">Powered by Stripe for safe transactions</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}