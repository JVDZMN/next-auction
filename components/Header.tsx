'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export function Header() {
  const { data: session, status } = useSession()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/user/role')
        .then(res => res.json())
        .then(data => setIsAdmin(data.role === 'Admin'))
        .catch(() => setIsAdmin(false))
    }
  }, [session])

  return (
    <header className="bg-white shadow-sm border-b">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Next Auction
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
            ) : session ? (
              <>
                <Link
                  href="/cars"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Browse Cars
                </Link>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    className="text-purple-600 hover:text-purple-700 px-3 py-2 rounded-md text-sm font-medium border border-purple-300"
                  >
                    👑 Admin
                  </Link>
                )}
                <div className="flex items-center gap-3 border-l pl-4">
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {session.user?.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {session.user?.email}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="ml-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => signIn()}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
