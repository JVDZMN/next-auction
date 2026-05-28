"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Send, MessageSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSocket } from "@/lib/useSocket"
import { cn } from "@/lib/utils"
import { sendMessage as sendMessageAction } from "@/app/actions/messages"

interface Message {
  id: string
  senderId: string
  content: string
  createdAt: string
  sender: { id: string; name: string | null; email: string; image?: string | null }
}

interface MessageSellerProps {
  carId: string
  ownerId: string
  ownerName: string
}

export default function MessageSeller({ carId, ownerId, ownerName }: MessageSellerProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const isOwner = session?.user?.id === ownerId

  // Real-time: receive new messages on this car channel
  const onSocketMessage = useCallback((msg: Message) => {
    if (msg.senderId === session?.user?.id || msg.sender?.id === session?.user?.id) return // already added optimistically
    setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
  }, [session?.user?.id])
  useSocket(carId, onSocketMessage)

  // Fetch history when panel opens
  useEffect(() => {
    if (!open || !session?.user) return
    setLoading(true)
    fetch(`/api/messages?carId=${carId}`)
      .then(r => r.json())
      .then(d => setMessages(d.messages ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, carId, session?.user])

  // Scroll to bottom on new message
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

  const send = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    setError(null)
    const content = input.trim()
    setInput("")
    try {
      const result = await sendMessageAction({ carId, receiverId: ownerId, content })
      if ('error' in result) {
        setError(result.error)
        setInput(content)
      } else {
        const msg = (result as { message: Message }).message
        setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
      }
    } catch {
      setError("Failed to send")
      setInput(content)
    } finally {
      setSending(false)
    }
  }

  // Don't show to the car owner (they reply from their dashboard)
  if (isOwner) return null
  if (!session?.user) return null

  return (
    <>
      <div className="mt-4">
        <Button variant="outline" onClick={() => setOpen(true)}>
          <MessageSquare className="h-4 w-4 mr-2" /> Message Seller
        </Button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: '80vh' }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{ownerName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm flex-1">{ownerName}</span>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {loading && <p className="text-sm text-center text-muted-foreground py-4">Loading…</p>}
              {!loading && messages.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-8">No messages yet. Say hello!</p>
              )}
              {messages.map(msg => {
                const mine = msg.senderId === session?.user?.id
                return (
                  <div key={msg.id} className={cn("flex gap-2", mine ? "justify-end" : "justify-start")}>
                    {!mine && (
                      <Avatar className="h-6 w-6 shrink-0 mt-1">
                        <AvatarImage src={(msg.sender as { image?: string | null }).image ?? undefined} />
                        <AvatarFallback className="text-[10px]">{(msg.sender.name ?? msg.sender.email).slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn(
                      "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                      mine ? "bg-blue-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-900 rounded-bl-sm"
                    )}>
                      <p className="whitespace-pre-wrap wrap-break-word">{msg.content}</p>
                      <p className={cn("text-[10px] mt-1", mine ? "text-blue-200" : "text-gray-400")}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t">
              {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
              <div className="flex gap-2 items-end">
                <Textarea
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  placeholder="Type a message…"
                  disabled={sending}
                  className="resize-none min-h-9.5 max-h-32"
                  maxLength={2001}
                />
                <Button size="sm" onClick={send} disabled={sending || !input.trim()} className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
