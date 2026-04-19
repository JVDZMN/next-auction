
'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import { UserCircleIcon, BellIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { MessagesModal } from '@/components/MessagesModal'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useUserChatSocket } from '@/lib/useUserChatSocket'
import { useNotificationSocket } from '@/lib/useNotificationSocket'


type ChatMessage = {
  senderId: string
  content: string
  carId?: string
}

type ChatUser = {
  id: string
  name: string
  image: string | null
}

export function Header() {
  const { data: session, status } = useSession()
  const isAdmin = session?.user?.role === 'Admin'
  const [showNotifModal, setShowNotifModal] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [messageUsers, setMessageUsers] = useState<ChatUser[]>([])
  const [bidNotifications, setBidNotifications] = useState<{ id: string; message: string; type: string; carId: string | null; createdAt: string }[]>([])
  const [activeChatUser, setActiveChatUser] = useState<ChatUser | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [activeChatCarId, setActiveChatCarId] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSocketMessage = useCallback((msg: ChatMessage) => {
    setChatMessages((prev) => [...prev, msg])
  }, [])

  // Always call the hook to preserve hook order
  const chatSocket = useUserChatSocket(
    session?.user?.id || '',
    activeChatUser?.id || '',
    handleSocketMessage
  )

  // Real-time: bump bell count and refresh lists when any notification arrives
  const handleNewNotification = useCallback(() => {
    setUnreadCount((prev) => prev + 1)
    fetch('/api/messages/notifications')
      .then((r) => r.json())
      .then((data) => {
        setMessageUsers(data.users || [])
        setBidNotifications(data.bidNotifications || [])
      })
      .catch(() => {})
  }, [])

  useNotificationSocket(session?.user?.id || '', handleNewNotification)

  // Load message history from DB when a chat is opened
  useEffect(() => {
    if (!activeChatUser) return


    async function load() {
      try {
        const r = await fetch(`/api/messages?peerId=${activeChatUser!.id}`)
        const data = await r.json()
        const msgs: ChatMessage[] = (data.messages || []).map(
          (m: { senderId: string; content: string; carId: string }) => ({
            senderId: m.senderId,
            content: m.content ?? '',
            carId: m.carId,
          })
        )
        setChatMessages(msgs)
        setActiveChatCarId((data.messages as { carId?: string }[])?.[0]?.carId ?? null)
      } catch {
        setChatMessages([])
        setActiveChatCarId(null)
      }
    }
    void load()
  }, [activeChatUser])

  useEffect(() => {
    if (!session?.user) return;
    const fetchMessageUsers = async () => {
      try {
        const res = await fetch('/api/messages/notifications');
        if (!res.ok) return;
        const data = await res.json();
        setMessageUsers(data.users || []);
        setBidNotifications(data.bidNotifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch {
        setMessageUsers([]);
        setUnreadCount(0);
      }
    };
    fetchMessageUsers();
  }, [session]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!session?.user || !activeChatUser) return
    // Optimistic update
    setChatMessages(prev => [...prev, { senderId: session.user.id, content }])
    if (activeChatCarId) {
      try {
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ carId: activeChatCarId, receiverId: activeChatUser.id, content }),
        })
      } catch {
        // ignore
      }
    } else if (chatSocket) {
      chatSocket.emit('sendMessage', { senderId: session.user.id, receiverId: activeChatUser.id, content })
    }
  }, [session, activeChatUser, activeChatCarId, chatSocket])

  return (
    <header className="w-full bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
        <Link href="/" className="text-2xl font-bold text-blue-600">Next Auction</Link>
        <nav className="hidden sm:flex gap-6 items-center">
          <Link href="/cars" className="hover:text-blue-600">Browse Cars</Link>          <Link href={isAdmin ? '/admin/dashboard' : '/dashboard'} className="hover:text-blue-600">Dashboard</Link>
          {isAdmin && (
            <Link href="/admin/dashboard" className="text-purple-600 font-semibold">👑 Admin</Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {session && (
            <button
              className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none"
              onClick={() => {
                setShowNotifModal(true)
                setUnreadCount(0)
                fetch('/api/messages/notifications', { method: 'PATCH' }).catch(() => {})
                // Fetch fresh lists (do not update unreadCount — we just zeroed it)
                fetch('/api/messages/notifications')
                  .then((r) => r.json())
                  .then((data) => {
                    setMessageUsers(data.users || [])
                    setBidNotifications(data.bidNotifications || [])
                  })
                  .catch(() => {})
              }}
              aria-label="Messages"
            >
              <BellIcon className="h-6 w-6 text-gray-500" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
          {status === 'loading' ? (
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
          ) : session ? (
            <div className="relative" ref={userMenuRef}>
              <button
                className="inline-flex items-center gap-2 px-3 py-2 border rounded-md shadow-sm bg-white hover:bg-gray-50"
                onClick={() => setShowUserMenu((v) => !v)}
              >
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    width={32}
                    height={32}
                    className="rounded-full"
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
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-1 w-56 bg-white border rounded-md shadow-lg z-50">
                  <Link
                    href={isAdmin ? '/admin/dashboard' : '/dashboard'}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Dashboard
                  </Link>
                  {(session.user as { mitIdVerified?: boolean }).mitIdVerified ? (
                    <div className="px-4 py-2 text-sm text-green-600 flex items-center gap-2">
                      <span>✅</span> MitID Verified
                    </div>
                  ) : (
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      onClick={() => { setShowUserMenu(false); window.location.href = '/api/mitid/start' }}
                    >
                      <span>🇩🇰</span> Verify with MitID
                    </button>
                  )}
                  <div className="border-t my-1" />
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={() => { setShowUserMenu(false); signOut() }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => signIn()}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
      {showNotifModal && (
        <MessagesModal
          messageUsers={messageUsers}
          bidNotifications={bidNotifications}
          activeChatUser={activeChatUser}
          chatMessages={chatMessages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          currentUserId={session?.user?.id ?? ''}
          onClose={() => { setShowNotifModal(false); setActiveChatUser(null); setActiveChatCarId(null) }}
          onSelectUser={setActiveChatUser}
          onBackToList={() => { setActiveChatUser(null); setActiveChatCarId(null) }}
          onSendMessage={handleSendMessage}
        />
      )}
    </header>
  )
}
    