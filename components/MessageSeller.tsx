"use client";
import { useState } from "react";
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';

interface MessageSellerProps {
  carId: string;
  ownerId: string;
  ownerName: string;
}

export default function MessageSeller({ carId, ownerId, ownerName }: MessageSellerProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (session?.user?.id === ownerId) return null;

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carId, receiverId: ownerId, content: input }),
      });
      const data = await res.json();
      if (data.message) {
        setInput("");
        setSuccess(true);
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
    <>
      <div className="mt-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
          onClick={() => setOpen(true)}
        >
          Message to seller
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
              onClick={() => { setOpen(false); setInput(""); setError(null); setSuccess(false); }}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-lg font-bold mb-4">Message {ownerName}</h3>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {success && <div className="text-green-600 mb-2">Message sent!</div>}
            <textarea
              className="w-full border rounded px-2 py-1 mb-4"
              rows={4}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              disabled={loading || !input.trim()}
            >
              <PaperAirplaneIcon className="h-5 w-5 inline" /> Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}