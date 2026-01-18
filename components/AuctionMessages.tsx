import { useEffect, useRef, useState, Fragment } from 'react';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/lib/useSocket';
// Removed HeroUI Modal import
import { ArrowUturnLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface Message {
  id?: string;
  carId: string;
  sender: {
    id: string;
    email: string;
    name?: string | null;
  };
  receiverId: string;
  content: string;
  createdAt?: string;
}

export function AuctionMessages({ carId, ownerId }: { carId: string; ownerId: string }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
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
    if (!input.trim() || !session?.user?.id)
      return;
    let messageText = input.trim();
    let receiverId = ownerId;
    let replyToMessageId: string | undefined = undefined;
    if (replyTo) {
      messageText = `↪️ [Reply to: ${replyTo.sender.email}: ${replyTo.content}]\n${messageText}`;
      // If replying, receiver is the original sender (unless you are replying to yourself)
      receiverId = replyTo.sender.id === session.user.id ? replyTo.receiverId : replyTo.sender.id;
      replyToMessageId = replyTo.id;
    } else if (session.user.id === ownerId) {
      // Seller must reply to a specific message (cannot initiate new message)
      alert('As the seller, you must reply to a specific message.');
      return;
    }
    const postBody = { carId, content: input, receiverId, replyToMessageId };
    console.log('Sending message:', postBody);
    // Save to DB
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postBody),
    });
    setInput('');
    setReplyTo(null);
  };

  return (
    <div className="bg-white rounded shadow p-4 mt-8">
      <h3 className="text-lg font-bold mb-2 text-black">Ask the Seller a Question</h3>
      <div className="h-48 overflow-y-auto border rounded p-2 mb-2 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center mt-12">No messages yet.</p>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`mb-2 group ${msg.sender.email === session?.user?.email ? 'text-right' : 'text-left'}`}
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => { setReplyTo(msg); setShowReplyDialog(true); }}
            >
              <span className="inline-block px-3 py-1 rounded bg-blue-100 text-blue-900 max-w-xs break-words">
                {msg.content}
              </span>
              <div className="text-xs text-gray-500 mt-1">
                  {msg.sender.id === session?.user?.id
                    ? `You (${msg.sender.email})`
                    : msg.sender.email
                }
                {' · '}
                {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
              </div>
              <button
                className="absolute right-0 top-0 text-xs text-blue-600 opacity-0 group-hover:opacity-100 bg-white border border-blue-200 rounded px-2 py-1 ml-2 flex items-center gap-1"
                style={{ zIndex: 2 }}
                onClick={e => { e.stopPropagation(); setReplyTo(msg); setShowReplyDialog(true); }}
                type="button"
                aria-label="Reply"
              >
                <ArrowUturnLeftIcon className="h-4 w-4" /> Reply
              </button>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        {(showReplyDialog && !!replyTo) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-medium leading-6 text-blue-900">
                Replying to {replyTo?.sender.email}
              </h3>
              <div className="mt-2 text-sm text-blue-900">
                {replyTo?.content}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="text-blue-600 underline text-sm"
                  onClick={() => { setShowReplyDialog(false); setReplyTo(null); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        <input
          className="flex-1 border rounded px-3 py-2 text-black"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-1">
          <PaperAirplaneIcon className="h-5 w-5" /> Send
        </button>
      </form>
    </div>
  );
}
