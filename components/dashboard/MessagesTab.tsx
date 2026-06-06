'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { sendMessage as sendMessageAction } from '@/app/actions/messages'
import { useUserChatSocket } from '@/lib/useUserChatSocket'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { MessageSquare, ArrowLeft, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatUser    { id: string; name: string; image: string | null }
interface ChatMessage { senderId: string; content: string; carId?: string }

interface Props {
  msgUsers: ChatUser[]
  unreadPerSender: Record<string, number>
  markSenderRead: (id: string) => void
  markMessagesRead: () => void
}

export function MessagesTab({ msgUsers, unreadPerSender, markSenderRead, markMessagesRead }: Props) {
  const { data: session } = useSession()
  const [activeChatUser,  setActiveChatUser]  = useState<ChatUser | null>(null)
  const [chatMessages,    setChatMessages]    = useState<ChatMessage[]>([])
  const [chatInput,       setChatInput]       = useState('')
  const [activeChatCarId, setActiveChatCarId] = useState<string | null>(null)

  // Mark all messages read when this tab mounts
  useEffect(() => { markMessagesRead() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeChatUser) return
    fetch(`/api/messages?peerId=${activeChatUser.id}`)
      .then(r => r.json())
      .then(data => {
        setChatMessages((data.messages ?? []).map((m: { senderId: string; content: string; carId: string }) => ({
          senderId: m.senderId, content: m.content ?? '', carId: m.carId,
        })))
        setActiveChatCarId((data.messages as { carId?: string }[])?.[0]?.carId ?? null)
      })
      .catch(() => { setChatMessages([]); setActiveChatCarId(null) })
  }, [activeChatUser])

  const handleIncoming = useCallback((msg: ChatMessage) => {
    setChatMessages(prev => [...prev, msg])
    if (msg.senderId && activeChatUser?.id === msg.senderId) markSenderRead(msg.senderId)
  }, [activeChatUser?.id, markSenderRead])

  useUserChatSocket(session?.user?.id ?? '', activeChatUser?.id ?? '', handleIncoming)

  const sendMessage = async () => {
    if (!chatInput.trim() || !session?.user || !activeChatUser) return
    const content = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { senderId: session.user.id, content }])
    if (activeChatCarId) {
      await sendMessageAction({ carId: activeChatCarId, receiverId: activeChatUser.id, content }).catch(() => {})
    }
  }

  return (
    <div className="rounded-lg border overflow-hidden min-h-120 grid md:grid-cols-[260px_1fr]">
      {/* Conversation list */}
      <div className="border-b md:border-b-0 md:border-r">
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Conversations</p>
        </div>
        {msgUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
            <MessageSquare className="h-8 w-8 opacity-30" />
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          <ul>
            {msgUsers.map(u => {
              const unread = unreadPerSender[u.id] ?? 0
              return (
                <li key={u.id}>
                  <button
                    onClick={() => { setActiveChatUser(u); markSenderRead(u.id) }}
                    className={cn('w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors', activeChatUser?.id === u.id && 'bg-muted')}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={u.image ?? undefined} />
                      <AvatarFallback className="text-xs">{u.name?.slice(0, 2).toUpperCase() ?? '?'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate flex-1">{u.name}</span>
                    {unread > 0 && (
                      <span className="ml-auto shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Chat panel */}
      {activeChatUser ? (
        <div className="flex flex-col">
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <button onClick={() => setActiveChatUser(null)} className="md:hidden text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Avatar className="h-7 w-7">
              <AvatarImage src={activeChatUser.image ?? undefined} />
              <AvatarFallback className="text-xs">{activeChatUser.name?.slice(0, 2).toUpperCase() ?? '?'}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm">{activeChatUser.name}</span>
          </div>

          <ScrollArea className="flex-1 p-4 min-h-0 h-80">
            {chatMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Start the conversation.</p>
            ) : (
              <ul className="space-y-2">
                {chatMessages.map((msg, i) => {
                  const isMine = msg.senderId === session?.user?.id
                  return (
                    <li key={i} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                      <span className={cn('max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-snug', isMine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>
                        {msg.content}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </ScrollArea>

          <Separator />
          <form onSubmit={e => { e.preventDefault(); void sendMessage() }} className="flex items-center gap-2 p-3">
            <Input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message…" className="flex-1 h-8 text-sm" maxLength={2001} />
            <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={!chatInput.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <MessageSquare className="h-10 w-10 opacity-20" />
          <p className="text-sm">Select a conversation</p>
        </div>
      )}
    </div>
  )
}
