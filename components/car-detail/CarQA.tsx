'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getPusherClient } from '@/lib/pusher-client'
import { useDict } from '@/lib/i18n/context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface CommentAuthor {
  id: string
  name: string | null
}

interface Comment {
  id: string
  body: string
  createdAt: string
  parentId: string | null
  author: CommentAuthor
  replies?: Comment[]
}

interface Props {
  carId: string
  ownerId: string
}

export function CarQA({ carId, ownerId }: Props) {
  const { data: session } = useSession()
  const td = useDict()
  const tq = td.cars.qa
  const [comments, setComments]   = useState<Comment[]>([])
  const [body, setBody]           = useState('')
  const [replyTo, setReplyTo]     = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch(`/api/cars/${carId}/comments`)
      .then(r => r.json())
      .then(data => setComments(data.comments ?? []))
      .catch(() => {})
  }, [carId])

  useEffect(() => {
    const pusher  = getPusherClient()
    const channel = pusher.subscribe(`car-${carId}`)
    const handler = (comment: Comment) => {
      setComments(prev => {
        if (comment.parentId) {
          return prev.map(c =>
            c.id === comment.parentId
              ? { ...c, replies: [...(c.replies ?? []), comment] }
              : c
          )
        }
        return [...prev, comment]
      })
    }
    channel.bind('new-comment', handler)
    return () => { channel.unbind('new-comment', handler) }
  }, [carId])

  const post = async (parentId: string | null = null) => {
    const text = parentId ? replyBody : body
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/cars/${carId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text.trim(), parentId }),
      })
      if (res.ok) {
        if (parentId) { setReplyBody(''); setReplyTo(null) }
        else setBody('')
      }
    } finally { setSubmitting(false) }
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  const topLevel = comments.filter(c => !c.parentId).map(c => ({
    ...c,
    replies: comments.filter(r => r.parentId === c.id),
  }))

  function CommentRow({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
    const initial = (comment.author.name ?? '?')[0].toUpperCase()
    return (
      <div className={depth > 0 ? 'ml-8 mt-3' : 'mt-4'}>
        <div className="flex items-start gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: 'var(--copper)' }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <span className="text-sm font-semibold">{comment.author.name ?? 'User'}</span>
              {comment.author.id === ownerId && (
                <Badge className="text-[10px] px-1.5 py-0 h-4 border-0 text-white" style={{ backgroundColor: 'var(--copper)' }}>
                  {tq.seller}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{fmt(comment.createdAt)}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{comment.body}</p>
            {session && depth === 0 && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors"
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              >
                {tq.reply}
              </button>
            )}
          </div>
        </div>

        {comment.replies?.map(r => <CommentRow key={r.id} comment={r} depth={depth + 1} />)}

        {replyTo === comment.id && session && (
          <div className="ml-9 mt-2 flex gap-2">
            <Textarea
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              placeholder={tq.placeholder}
              className="text-sm min-h-[60px] resize-none"
              maxLength={500}
            />
            <div className="flex flex-col gap-1 shrink-0">
              <Button
                size="sm"
                disabled={submitting || !replyBody.trim()}
                onClick={() => post(comment.id)}
                style={{ backgroundColor: 'var(--copper)' }}
                className="text-white border-0"
              >
                {tq.submit}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setReplyTo(null); setReplyBody('') }}
              >
                {td.common.cancel}
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {tq.title}
          {comments.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">({comments.length})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topLevel.length === 0 && (
          <p className="text-sm text-muted-foreground mb-4">{tq.noComments}</p>
        )}
        <div className="divide-y divide-border/50">
          {topLevel.map(c => <CommentRow key={c.id} comment={c} />)}
        </div>

        {session ? (
          <div className="flex gap-2 pt-4 mt-4 border-t border-border/50">
            <Textarea
              ref={textareaRef}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={tq.placeholder}
              className="text-sm min-h-[72px] resize-none"
              maxLength={500}
            />
            <Button
              size="sm"
              disabled={submitting || !body.trim()}
              onClick={() => post(null)}
              className="self-end text-white border-0"
              style={{ backgroundColor: 'var(--copper)' }}
            >
              {tq.submit}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground pt-4 mt-2 border-t border-border/50">
            {tq.signInPrompt}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
