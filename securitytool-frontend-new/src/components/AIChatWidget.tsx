import React, { useState, useRef, useEffect } from 'react';
import axios from '../api/axiosInstance';

const AIChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { sender: 'user' as const, text: input };
    setMessages(msgs => [...msgs, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await axios.post('/ai/chat', { message: input });
      setMessages(msgs => [...msgs, { sender: 'ai', text: res.data || 'No response.' }]);
    } catch (err: any) {
      setMessages(msgs => [...msgs, { sender: 'ai', text: 'Error: Could not get response.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className="fixed z-50 bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center hover:scale-110 transition-transform border-2 border-white"
        onClick={() => setOpen(o => !o)}
        aria-label="Open AI Chat"
      >
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h8c1.1 0 2-.9 2-2v-8c0-5.52-4.48-10-10-10zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8v6h-8z"/>
          <circle cx="9" cy="12" r="1.5"/>
          <circle cx="15" cy="12" r="1.5"/>
          <path d="M8 15.5c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2"/>
        </svg>
      </button>
      {/* Chat Window */}
      {open && (
        <div className="fixed z-50 bottom-28 right-8 w-96 max-w-[95vw] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white">
            <span className="font-semibold text-lg">AI Chatbot</span>
            <button onClick={() => setOpen(false)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
          </div>
          <div className="flex-1 p-6 overflow-y-auto max-h-96" style={{ minHeight: 300 }}>
            {messages.length === 0 && <div className="text-gray-400 text-center text-base">Ask me anything!</div>}
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-3 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-3 rounded-lg text-base max-w-[75%] ${msg.sender === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-800'}`}>{msg.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendMessage} className="flex border-t border-gray-200">
            <input
              type="text"
              className="flex-1 px-4 py-3 outline-none text-base"
              placeholder="Type your message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              className="px-6 py-3 bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-colors disabled:opacity-50 text-base"
              disabled={loading || !input.trim()}
            >
              {loading ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChatWidget;
