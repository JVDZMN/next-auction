import React, { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/lib/useSocket';
import type { Message as PrismaMessage, User } from '@prisma/client';

type Message = PrismaMessage & {
  sender: User;
};

interface MessagingProps {
  carId: string;
  ownerId: string;
}

const Messaging: React.FC<MessagingProps> = ({ carId, ownerId }) => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/messages?carId=${carId}`);
        const data = await res.json();
        if (data.messages) setMessages(data.messages);
        else setError(data.error || 'Failed to fetch messages');
      } catch (e) {
        setError('Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [carId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time updates (Socket.IO)
  useEffect(() => {
    const onMessage = (msg: Message) => {
      console.log('[Socket] Received newMessage:', msg);
      if (msg.carId === carId) setMessages((prev) => [...prev, msg]);
    };
    const sock = useSocket(carId, onMessage);
    setSocket(sock);
    console.log('[Socket] Joined car room:', carId);
    return () => {
      sock?.off('newMessage', onMessage);
    };
  }, [carId]);

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carId) {
      setError('Car ID is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Determine receiverId: if replying, use the original sender; else, if owner, require reply; else, use ownerId
      let receiverId = ownerId;
      let replyToMessageId: string | undefined = undefined;
      if (replyTo) {
        receiverId = replyTo.sender.id === session?.user?.id ? replyTo.receiverId : replyTo.sender.id;
        replyToMessageId = replyTo.id;
      } else if (session?.user?.id === ownerId) {
        setError('As the seller, you must reply to a specific message.');
        setLoading(false);
        return;
      }
      const postBody = { carId, receiverId, replyToMessageId, content: input.trim() };
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postBody),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setInput('');
        setReplyTo(null);
        // Optionally emit socket event
        socket?.emit && socket.emit('sendMessage', { ...data.message, carId });
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (e) {
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
    };
    
  return (
    <div className="border rounded-lg p-4 max-w-lg mx-auto bg-white shadow">
      <div className="h-64 overflow-y-auto mb-4 bg-gray-50 p-2 rounded">
        {loading && <div>Loading...</div>}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 flex ${msg.sender.id === session?.user?.id ? 'justify-end' : 'justify-start'} group relative cursor-pointer`}
            onClick={() => setReplyTo(msg)}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-xs wrap-break-word text-sm ${
                msg.sender.email === session?.user?.email
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {msg.content && (
                <div className="mb-1 whitespace-pre-line">{msg.content}</div>
              )}
              <div className="text-xs text-gray-400 mt-1 text-right">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </div>
            </div>
            <button
              className="absolute right-0 top-0 text-xs text-blue-600 opacity-0 group-hover:opacity-100 bg-white border border-blue-200 rounded px-2 py-1 ml-2 z-20"
              onClick={e => { e.stopPropagation(); setReplyTo(msg); }}
            >
              Reply
            </button>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {replyTo && (
        <div className="mb-2 p-2 bg-blue-50 border-l-4 border-blue-400 text-xs text-blue-900 flex items-center justify-between">
          <span>
            Replying to <b>{replyTo.sender.email}</b>
          </span>
          <button className="ml-2 text-blue-600 underline" onClick={() => setReplyTo(null)} type="button">Cancel</button>
        </div>
      )}
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </form>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  );
};

export default Messaging;
