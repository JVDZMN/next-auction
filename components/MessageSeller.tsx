"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Send } from "lucide-react"
import { MessageCreateSchema } from "@/lib/zod"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface MessageSellerProps {
  carId: string
  ownerId: string
  ownerName: string
}

export default function MessageSeller({ carId, ownerId, ownerName }: MessageSellerProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (session?.user?.id === ownerId) return null

  const handleClose = () => { setOpen(false); setInput(""); setError(null); setSuccess(false) }

  const sendMessage = async () => {
    const result = MessageCreateSchema.safeParse({ carId, receiverId: ownerId, content: input })
    if (!result.success) { setError(result.error.issues[0].message); return }
    setLoading(true); setError(null); setSuccess(false)
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      })
      const data = await res.json()
      if (data.message) { setInput(""); setSuccess(true) }
      else setError(data.error || "Failed to send message")
    } catch {
      setError("Failed to send message")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mt-4">
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Send className="h-4 w-4 mr-2" /> Message Seller
        </Button>
      </div>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Message {ownerName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {success && <Alert><AlertDescription>Message sent!</AlertDescription></Alert>}
            <Textarea
              rows={4}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message…"
              disabled={loading}
              maxLength={2001}
              className={input.length > 2000 ? "border-destructive" : ""}
            />
            {input.length > 1800 && (
              <p className={`text-xs text-right ${input.length > 2000 ? "text-destructive" : "text-muted-foreground"}`}>
                {input.length}/2000
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={sendMessage} disabled={loading || !input.trim() || input.length > 2000}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
