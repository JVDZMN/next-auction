'use client'

import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

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

type BidNotification = {
  id: string
  message: string
  type: string
  carId: string | null
  createdAt: string
}

type Props = {
  messageUsers: ChatUser[]
  bidNotifications: BidNotification[]
  activeChatUser: ChatUser | null
  chatMessages: ChatMessage[]
  chatInput: string
  setChatInput: (v: string) => void
  currentUserId: string
  onClose: () => void
  onSelectUser: (user: ChatUser) => void
  onBackToList: () => void
  onSendMessage: (content: string) => void
}

export function MessagesModal({
  messageUsers,
  bidNotifications,
  activeChatUser,
  chatMessages,
  chatInput,
  setChatInput,
  currentUserId,
  onClose,
  onSelectUser,
  onBackToList,
  onSendMessage,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-96 max-w-full p-4 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {!activeChatUser ? (
          <div className="max-h-[70vh] overflow-y-auto">
            {bidNotifications.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Bid Activity</h3>
                <ul className="space-y-2">
                  {bidNotifications.map((n) => (
                    <li key={n.id} className="flex items-start gap-2 p-2 rounded bg-amber-50 border border-amber-100">
                      <span className="mt-0.5 text-lg">{n.type === 'outbid' ? '⚠️' : '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{n.message}</p>
                        {n.carId && (
                          <a
                            href={`/cars/${n.carId}`}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View listing
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Messages</h3>
            {messageUsers.length === 0 ? (
              <div className="text-gray-500 text-sm">No messages yet.</div>
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
                      onClick={() => onSelectUser(user)}
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
              onClick={onBackToList}
            >
              ← Back to messages
            </button>
            <h3 className="text-lg font-semibold mb-2">Chat with {activeChatUser.name}</h3>
            <div className="border rounded p-2 h-48 overflow-y-auto bg-gray-50 mb-2">
              {chatMessages.length === 0 ? (
                <div className="text-gray-500 text-sm">
                  Chat room between you and {activeChatUser.name}.
                </div>
              ) : (
                <ul className="space-y-1">
                  {chatMessages.map((msg, idx) => (
                    <li
                      key={idx}
                      className={msg.senderId === currentUserId ? 'text-right' : 'text-left'}
                    >
                      <span
                        className={
                          msg.senderId === currentUserId
                            ? 'bg-blue-100 text-blue-800 px-2 py-1 rounded'
                            : 'bg-gray-200 text-gray-800 px-2 py-1 rounded'
                        }
                      >
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
                const content = chatInput.trim()
                if (!content) return
                setChatInput('')
                onSendMessage(content)
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
              <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
