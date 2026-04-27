'use client';

import { useState } from 'react';
import { MessageCircle, X, Send, Bot, Leaf } from 'lucide-react';
import { aiApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { v4 as uuidv4 } from 'uuid';

interface Message { role: 'user' | 'assistant'; content: string; }

export default function AIPlantBot() {
  const { isAuthenticated } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m Veda 🌿, your personal plant care expert. Ask me anything about plants, care tips, or get recommendations!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    if (!isAuthenticated) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Please login to chat with me! 😊' }]);
      return;
    }

    const userMsg: Message = { role: 'user', content: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiApi.chat(input, sessionId) as any;
      setMessages((m) => [...m, { role: 'assistant', content: res.data || 'Let me help you with that!' }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I\'m having trouble connecting. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 right-4 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 flex flex-col" style={{ height: '480px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-800 to-primary-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Veda — Plant Expert</p>
                <p className="text-xs text-green-200">● Online</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center mr-2 flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-800" />
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary-800 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center"><Bot className="w-4 h-4 text-primary-800" /></div>
                <div className="bg-gray-100 px-3 py-2 rounded-xl rounded-bl-none">
                  <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about plant care..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-9 h-9 bg-primary-800 hover:bg-primary-900 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-primary-800 hover:bg-primary-900 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-all hover:scale-110"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-lagaao-orange rounded-full text-xs flex items-center justify-center font-bold">1</span>
        )}
      </button>
    </>
  );
}
