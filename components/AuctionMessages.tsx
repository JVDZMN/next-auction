"use client";
import { useSocket } from '@/lib/useSocket';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useEffect, useState, useCallback } from 'react';
import { sendMessage as sendMessageAction } from '@/app/actions/messages';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleSocketMessage = useCallback((msg: Message) => {
    setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
  }, []);

  useSocket(carId, handleSocketMessage);

  useEffect(() => {
    fetchMessages();
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
    } catch {
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
      const result = await sendMessageAction({ carId, receiverId: ownerId, content: input });
      if ('error' in result) {
        setError(result.error);
      } else {
        const msg = (result as { message: Message }).message
        setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
        setInput('');
      }
    } catch {
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
