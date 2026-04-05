
import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Menu } from '@headlessui/react'
import { UserCircleIcon, BellIcon, ChatBubbleLeftRightIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { useEffect, useState, useCallback } from 'react'
import { useUserChatSocket } from '@/lib/useUserChatSocket'


export function Header() {
  const { data: session, status } = useSession()
  const isAdmin = session?.user?.role === 'Admin'
  const [showNotifModal, setShowNotifModal] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [messageUsers, setMessageUsers] = useState<{id: string, name: string, image: string | null}[]>([])
  const [activeChatUser, setActiveChatUser] = useState<{id: string, name: string, image: string | null} | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')

  const handleSocketMessage = useCallback((msg: any) => {
    setChatMessages((prev) => [...prev, msg])
  }, [])

  // Always call the hook to preserve hook order
  const chatSocket = useUserChatSocket(
    session?.user?.id || '',
    activeChatUser?.id || '',
    handleSocketMessage
  )

  useEffect(() => {
    if (!session?.user) return;
    // Fetch users who messaged the auction owner
    const fetchMessageUsers = async () => {
      try {
        const res = await fetch('/api/messages/notifications');
        if (!res.ok) return;
        const data = await res.json();
        // Expecting: { users: [{id, name, image}], unreadCount: number }
        setMessageUsers(data.users || []);
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        // Optionally handle error
        setMessageUsers([]);
        setUnreadCount(0);
      }
    };
    fetchMessageUsers();
  }, [session]);

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
          {session && (
            <button
              className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none"
              onClick={() => setShowNotifModal(true)}
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
            </Menu>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg w-96 max-w-full p-4 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setShowNotifModal(false)
                setActiveChatUser(null)
              }}
              aria-label="Close"
            >
              ×
            </button>
            {!activeChatUser ? (
              <div>
                <h3 className="text-lg font-semibold mb-2">Messages</h3>
                {messageUsers.length === 0 ? (
                  <div className="text-gray-500">No messages yet.</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {messageUsers.map(user => (
                      <li key={user.id} className="py-2 flex items-center gap-3">
                        {user.image ? (
                          <img src={user.image} alt={user.name} className="h-8 w-8 rounded-full" />
                        ) : (
                          <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-400" />
                        )}
                        <span className="font-medium text-gray-900">{user.name}</span>
                        <button
                          className="ml-auto px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          onClick={() => setActiveChatUser(user)}
                        >
                          Open Chat
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div>
                <button
                  className="mb-2 text-blue-600 hover:underline"
                  onClick={() => setActiveChatUser(null)}
                >← Back to messages</button>
                <h3 className="text-lg font-semibold mb-2">Chat with {activeChatUser ? activeChatUser.name : ''}</h3>
                <div className="border rounded p-2 h-48 overflow-y-auto bg-gray-50 mb-2">
                  {chatMessages.length === 0 ? (
                    <div className="text-gray-500 text-sm">Chat room between you and {activeChatUser ? activeChatUser.name : ''}.</div>
                  ) : (
                    <ul className="space-y-1">
                      {chatMessages.map((msg, idx) => (
                        <li key={idx} className={session && session.user && msg.senderId === session.user.id ? 'text-right' : 'text-left'}>
                          <span className={session && session.user && msg.senderId === session.user.id ? 'bg-blue-100 text-blue-800 px-2 py-1 rounded' : 'bg-gray-200 text-gray-800 px-2 py-1 rounded'}>
                            {msg.content}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <form
                  onSubmit={e => {
                    e.preventDefault()
                    if (!chatInput.trim() || !chatSocket || !session || !session.user || !activeChatUser) return
                    chatSocket.emit('sendMessage', {
                      senderId: session.user.id,
                      receiverId: activeChatUser.id,
                      content: chatInput,
                    })
                    setChatMessages(prev => [...prev, { senderId: session.user.id, content: chatInput }])
                    setChatInput('')
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    className="w-full border rounded px-2 py-1 mb-2"
                    placeholder="Type a message..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                  />
                  <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">Send</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
    