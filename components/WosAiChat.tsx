
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Sparkles, Bot, User as UserIcon } from 'lucide-react';
import { chatWithWosAI } from '../services/geminiService';
import { User } from '../types';

interface ChatMessage { id: string; role: 'user' | 'model'; text: string; }

// Added lang to the props definition to resolve the assignment error in App.tsx
export const RunnaAiChat = ({ user, onBack, lang }: { user: User, onBack: () => void, lang: 'en' | 'fr' | 'es' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 'welcome', role: 'model', text: '¡Hola! Soy Runna. ¿Cómo puedo ayudarte hoy?' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
        const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
        const responseText = await chatWithWosAI(input, history, user.customApiKey);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: responseText }]);
    } catch (e: any) { alert(e.message); } 
    finally { setIsLoading(false); }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-white dark:bg-gray-900 text-gray-900 dark:text-white fixed inset-0 z-50">
        <div className="p-4 border-b dark:border-gray-800 flex items-center gap-3 shadow-sm bg-white dark:bg-gray-900 shrink-0">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><ArrowLeft /></button>
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full wos-gradient flex items-center justify-center text-white"><Sparkles size={16} /></div>
                <div><h2 className="font-bold text-lg leading-none">Runna AI</h2><span className="text-xs text-green-500 font-medium">Asistente en línea</span></div>
            </div>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950 overscroll-contain">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-gray-200 dark:bg-gray-700' : 'wos-gradient text-white'}`}>{msg.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}</div>
                        <div className={`p-3 rounded-2xl ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-800 border dark:border-gray-700'}`}><p className="text-sm md:text-base whitespace-pre-wrap">{msg.text}</p></div>
                    </div>
                </div>
            ))}
        </div>
        <div className="p-4 bg-white dark:bg-gray-900 border-t dark:border-gray-800">
            <div className="flex items-center gap-2 max-w-4xl mx-auto bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Escribe aquí..." className="flex-1 bg-transparent border-none outline-none px-4 py-2" />
                <button onClick={handleSend} disabled={!input.trim() || isLoading} className="p-3 wos-gradient text-white rounded-full"><Send size={18} /></button>
            </div>
        </div>
    </div>
  );
};
