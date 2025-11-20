import React, { useState, useRef, useEffect } from 'react';
import { Send, StopCircle, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Message, Sender, AppMode } from '../types';
import { geminiService } from '../services/geminiService';
import MarkdownRenderer from './MarkdownRenderer';
import { MODES } from '../constants';

interface ChatInterfaceProps {
  currentMode: AppMode;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentMode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize chat when mode changes
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      text: `Olá! Sou o **${MODES[currentMode].name}**. \n\n${MODES[currentMode].description}\n\nComo posso ajudar com seus processos de comércio exterior hoje?`,
      sender: Sender.Bot,
      timestamp: new Date()
    }]);
    geminiService.startChat(currentMode);
  }, [currentMode]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentMode]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: Sender.User,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    let botText = '';
    let groundingUrls: {uri: string, title: string}[] = [];

    // Add placeholder bot message
    setMessages(prev => [...prev, {
      id: botMessageId,
      text: '',
      sender: Sender.Bot,
      timestamp: new Date()
    }]);

    try {
      const stream = geminiService.sendMessageStream(userMessage.text);

      for await (const chunk of stream) {
        if (typeof chunk === 'string') {
          botText += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId ? { ...msg, text: botText } : msg
          ));
        } else if (chunk.groundingMetadata) {
          // Extract grounding chunks (Google Search results)
          const chunks = chunk.groundingMetadata.groundingChunks;
          if (chunks) {
            chunks.forEach((c: any) => {
              if (c.web) {
                groundingUrls.push({ uri: c.web.uri, title: c.web.title });
              }
            });
            // Update message with grounding URLs
            setMessages(prev => prev.map(msg => 
                msg.id === botMessageId ? { ...msg, groundingUrls: groundingUrls } : msg
            ));
          }
        }
      }
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, text: "Desculpe, ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.", isError: true } 
          : msg
      ));
    } finally {
      setIsLoading(false);
      // Re-focus input after sending
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedQuery = (query: string) => {
    setInput(query);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header - Mobile Title */}
      <div className="md:hidden p-4 border-b border-slate-200 bg-white flex items-center justify-center">
         <span className="font-semibold text-slate-800">{MODES[currentMode].name}</span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex w-full ${msg.sender === Sender.User ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`
                max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-3 shadow-sm
                ${msg.sender === Sender.User 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                }
                ${msg.isError ? 'bg-red-50 border-red-200 text-red-800' : ''}
              `}
            >
              {msg.sender === Sender.Bot ? (
                <>
                  <MarkdownRenderer content={msg.text} />
                  {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Fontes:</p>
                      <div className="flex flex-wrap gap-2">
                        {msg.groundingUrls.map((url, idx) => (
                           <a 
                             key={idx} 
                             href={url.uri} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                           >
                             <ExternalLink size={10} />
                             {url.title || new URL(url.uri).hostname}
                           </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{msg.text}</p>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
           <div className="flex justify-start">
             <div className="bg-slate-100 rounded-2xl rounded-bl-none px-5 py-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions (only if few messages) */}
      {messages.length < 2 && !isLoading && (
        <div className="px-4 md:px-6 pb-2">
          <p className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">Sugestões</p>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {MODES[currentMode].suggestedQueries.map((q, i) => (
              <button 
                key={i}
                onClick={() => handleSuggestedQuery(q)}
                className="whitespace-nowrap text-sm text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-slate-50 border border-slate-300 rounded-xl p-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-shadow">
           <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua dúvida sobre comércio exterior..."
            className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[24px] py-2 px-2 text-slate-800 placeholder-slate-400"
            rows={1}
            style={{ height: input ? 'auto' : '24px' }}
            onInput={(e) => {
               const target = e.target as HTMLTextAreaElement;
               target.style.height = 'auto';
               target.style.height = target.scrollHeight + 'px';
            }}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-lg flex-shrink-0 transition-all duration-200
              ${input.trim() && !isLoading 
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
        <div className="text-center mt-2">
           <p className="text-[10px] text-slate-400">
             ComexGlobal AI pode cometer erros. Verifique informações importantes. Não substitui consultoria jurídica formal.
           </p>
        </div>
      </div>
    </div>
  );
};