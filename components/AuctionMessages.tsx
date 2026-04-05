"use client";
import { useSocket } from '@/lib/useSocket';
// Removed HeroUI Modal import
import { ArrowUturnLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';


// File was truncated. Re-adding a minimal valid AuctionMessages component to fix build error.

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  carId: string;
  sender: { id: string; email: string; name?: string | null };
  receiver: { id: string; email: string; name?: string | null };
  content: string;
  createdAt: string;
}

interface AuctionMessagesProps {
  carId: string;
  ownerId: string;
}

export default function AuctionMessages({ carId, ownerId }: AuctionMessagesProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Real-time: Listen for new messages via Socket.IO
  const handleSocketMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const socket = useSocket(carId, handleSocketMessage);

  // Join user room for direct messages
  useEffect(() => {
    if (socket && session?.user?.id) {
      socket.emit('joinUserRoom', session.user.id);
    }
  }, [socket, session]);

  useEffect(() => {
    fetchMessages();
    // Optionally, add polling or socket updates here
    // Join car room on mount
    if (socket && carId) {
      socket.emit('joinCarRoom', carId);
    }
    // Cleanup: leave room if needed
    return () => {
      if (socket && carId) {
        socket.emit('leaveCarRoom', carId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId]);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/messages?carId=${carId}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
      else setError(data.error || 'Failed to load messages');
    } catch (err) {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carId, receiverId: ownerId, content: input }),
      });
      const data = await res.json();
      if (data.message) {
        setInput('');
        // Emit real-time event to all clients (including sender)
        if (socket) {
          socket.emit('sendMessage', { carId, message: data.message, receiverId: ownerId });
        }
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 border rounded-lg p-4 bg-white" style={{ color: '#000' }}>
      <h2 className="text-lg font-semibold mb-2">Auction Messages</h2>
      <div className="max-h-64 overflow-y-auto mb-4">
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {messages.length === 0 && !loading && <div>No messages yet.</div>}
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <span className="font-bold">{msg.sender.name || msg.sender.email}:</span>
            <span className="ml-2">{msg.content}</span>
            <span className="ml-2 text-xs text-gray-500">{new Date(msg.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded px-2 py-1"
          placeholder="Type your message..."
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          disabled={loading || !input.trim()}
        >
          <PaperAirplaneIcon className="h-5 w-5 inline" /> Send
        </button>
      </div>
    </div>
  );
}
