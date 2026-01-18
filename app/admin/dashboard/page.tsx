'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Header } from '@/components/Header'
import AdminTabs from '@/components/AdminTabs'

interface Stats {
  totalUsers: number
  totalCars: number
  activeCars: number
  totalBids: number
  adminCount: number
  sellerCount: number
  bidderCount: number
}

interface User {
  id: string
  name: string | null
  email: string
  rating?: number
  createdAt?: string
  role?: string
  _count?: {
    cars?: number
    bids?: number
  }
  totalBidAmount?: number
  totalBids?: number
}

interface Car {
  id: string
  brand: string
  model: string
  year: number
  currentPrice: number
  status: string
  createdAt: string
  owner: {
    name: string | null
    email: string
  }
}

interface DashboardData {
  stats: Stats
  adminUsers: User[]
  sellers: User[]
  bidders: User[]
  recentUsers: User[]
  recentCars: Car[]
  topBidders: User[]
}

export default function AdminDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'sellers' | 'bidders' | 'cars'>('overview')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      
      if (response.status === 403) {
        setError('Access denied. Admin privileges required.')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center text-red-600">
            {error || 'Failed to load dashboard'}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage users, cars, and monitor auction activity</p>
        </div>

        {/* Tabs */}
        <AdminTabs activeTab={activeTab} setActiveTab={tab => setActiveTab(tab as typeof activeTab)} />

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Users" value={data.stats.totalUsers} icon="👥" />
              <StatCard title="Total Cars" value={data.stats.totalCars} icon="🚗" />
              <StatCard title="Active Auctions" value={data.stats.activeCars} icon="⚡" />
              <StatCard title="Total Bids" value={data.stats.totalBids} icon="💰" />
              <StatCard title="Admins" value={data.stats.adminCount} icon="👑" />
              <StatCard title="Sellers" value={data.stats.sellerCount} icon="📦" />
              <StatCard title="Bidders" value={data.stats.bidderCount} icon="🎯" />
            </div>

            {/* Recent Activity */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Users */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Users</h2>
                <div className="space-y-3">
                  {data.recentUsers.map((user) => (
                    <div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{user.name || 'Anonymous'}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Bidders */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Top Bidders</h2>
                <div className="space-y-3">
                  {data.topBidders.map((bidder, index) => (
                    <div key={bidder.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <div>
                          <p className="font-medium">{bidder.name || 'Anonymous'}</p>
                          <p className="text-sm text-gray-600">{bidder.totalBids} bids</p>
                        </div>
                      </div>
                      <p className="font-semibold text-green-600">
                        ${bidder.totalBidAmount?.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">All Users ({data.recentUsers.length})</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.recentUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{user.name || 'Anonymous'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded ${
                            user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Sellers Tab */}
        {activeTab === 'sellers' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Sellers ({data.sellers.length})</h2>
              <div className="space-y-3">
                {data.sellers.map((seller) => (
                  <div key={seller.id} className="flex justify-between items-center p-4 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{seller.name || 'Anonymous'}</p>
                      <p className="text-sm text-gray-600">{seller.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{seller._count?.cars || 0} cars listed</p>
                      <p className="text-sm text-gray-600">⭐ {seller.rating?.toFixed(1) || '0.0'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bidders Tab */}
        {activeTab === 'bidders' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Bidders ({data.bidders.length})</h2>
              <div className="space-y-3">
                {data.bidders.map((bidder) => (
                  <div key={bidder.id} className="flex justify-between items-center p-4 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{bidder.name || 'Anonymous'}</p>
                      <p className="text-sm text-gray-600">{bidder.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{bidder._count?.bids || 0} bids placed</p>
                      <p className="text-sm text-gray-600">⭐ {bidder.rating?.toFixed(1) || '0.0'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cars Tab */}
        {activeTab === 'cars' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Cars ({data.recentCars.length})</h2>
              <div className="space-y-3">
                {data.recentCars.map((car) => (
                  <a
                    key={car.id}
                    href={`/admin/cars/${car.id}`}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="font-medium">{car.year} {car.brand} {car.model}</p>
                      <p className="text-sm text-gray-600">by {car.owner.name || car.owner.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">${car.currentPrice.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        car.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {car.status}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  )
}
