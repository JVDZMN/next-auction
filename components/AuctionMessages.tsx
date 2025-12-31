import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/lib/useSocket';

interface Message {
  id?: string;
  carId: string;
  senderEmail: string;
  receiverId: string;
  content: string;
  createdAt?: string;
}

export function AuctionMessages({ carId, ownerId }: { carId: string; ownerId: string }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial messages
  useEffect(() => {
    fetch(`/api/messages?carId=${carId}`)
      .then((res) => res.json())
      .then((data) => setMessages(data.messages || []));
  }, [carId]);

  // Real-time updates
  useSocket(carId, (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !session?.user?.email) return;
    const msg: Message = {
      carId,
      senderEmail: session.user.email,
      receiverId: ownerId,
      content: input.trim(),
    };
    // Save to DB
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });
    // Emit real-time
    // @ts-ignore
    window.socket?.emit('sendMessage', msg);
    setInput('');
  };

  return (
    <div className="bg-white rounded shadow p-4 mt-8">
      <h3 className="text-lg font-bold mb-2">Ask the Seller a Question</h3>
      <div className="h-48 overflow-y-auto border rounded p-2 mb-2 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center mt-12">No messages yet.</p>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`mb-2 ${msg.senderEmail === session?.user?.email ? 'text-right' : 'text-left'}`}>
              <span className="inline-block px-3 py-1 rounded bg-blue-100 text-blue-900 max-w-xs break-words">
                {msg.content}
              </span>
              <div className="text-xs text-gray-500 mt-1">
                {msg.senderEmail === session?.user?.email ? 'You' : 'Seller'} · {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Send
        </button>
      </form>
    </div>
  );
}
