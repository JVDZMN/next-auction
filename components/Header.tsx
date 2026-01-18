'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { UserCircleIcon, ArrowRightOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/outline'

export function Header() {
  const { data: session, status } = useSession()
  const isAdmin = session?.user?.role === 'Admin'

  return (
    <header className="w-full bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
        <Link href="/" className="text-2xl font-bold text-blue-600">Next Auction</Link>
        <nav className="hidden sm:flex gap-6 items-center">
          <Link href="/cars" className="hover:text-blue-600">Browse Cars</Link>
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          {isAdmin && (
            <Link href="/admin/dashboard" className="text-purple-600 font-semibold">👑 Admin</Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {status === 'loading' ? (
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
          ) : session ? (
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="inline-flex items-center gap-2 px-3 py-2 border rounded-md shadow-sm bg-white hover:bg-gray-50">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  )}
                  <span className="flex flex-col text-left">
                    <span className="text-sm font-medium text-gray-900">
                      {session.user?.name || 'User'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {session.user?.email || ''}
                    </span>
                  </span>
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none z-50">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => signOut()}
                          className={`w-full flex items-center px-4 py-2 text-sm text-gray-700 ${active ? 'bg-gray-100' : ''}`}
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 text-gray-400" />
                          Sign Out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          ) : (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => signIn()}
            >
              Sign In
            </button>
          )}
          {/* Mobile menu button */}
          <Menu as="div" className="sm:hidden relative inline-block text-left ml-2">
            <div>
              <Menu.Button className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 focus:outline-none">
                <Bars3Icon className="h-6 w-6" />
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none z-50">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link href="/cars" className={`block px-4 py-2 text-sm text-gray-700 ${active ? 'bg-gray-100' : ''}`}>Browse Cars</Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link href="/dashboard" className={`block px-4 py-2 text-sm text-gray-700 ${active ? 'bg-gray-100' : ''}`}>Dashboard</Link>
                    )}
                  </Menu.Item>
                  {isAdmin && (
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/admin/dashboard" className={`block px-4 py-2 text-sm text-purple-600 font-semibold ${active ? 'bg-gray-100' : ''}`}>👑 Admin</Link>
                      )}
                    </Menu.Item>
                  )}
                  <Menu.Item>
                    {({ active }) => (
                      status === 'loading' ? (
                        <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mx-4 my-2" />
                      ) : session ? (
                        <button
                          onClick={() => signOut()}
                          className={`w-full flex items-center px-4 py-2 text-sm text-gray-700 ${active ? 'bg-gray-100' : ''}`}
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 text-gray-400" />
                          Sign Out
                        </button>
                      ) : (
                        <button
                          className="w-full px-4 py-2 text-left text-blue-600 hover:underline"
                          onClick={() => signIn()}
                        >
                          Sign In
                        </button>
                      )
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  )
}
    