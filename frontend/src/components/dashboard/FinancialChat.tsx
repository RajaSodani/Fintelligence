import { useState, useEffect, useRef } from 'react'
import { Send, Bot } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { cn } from '@/lib/utils'

interface Props {
  transactionsContext: object[]
}

export function FinancialChat({ transactionsContext }: Props) {
  const [input, setInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const { messages, sendMessage, isTyping } = useChat({ transactionsContext })

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
  }

  return (
    <div className="bg-[var(--bg2)] border border-[var(--border2)] rounded-2xl overflow-hidden shadow-card flex flex-col" style={{ minHeight: 480 }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[rgba(0,232,122,0.2)] to-[rgba(77,159,255,0.2)] flex items-center justify-center">
          <Bot size={17} className="text-[var(--green)]" />
        </div>
        <div>
          <p className="font-syne font-bold text-[15px] text-[var(--text)] leading-tight">AI Financial Assistant</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
            <span className="font-mono text-2xs text-[var(--green)]">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4 min-h-0">
        {messages.length === 0 && !isTyping && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-[var(--text3)] text-center">
              Ask me anything about your finances.<br />I have context on your recent transactions.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-[var(--bg4)] flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                <Bot size={13} className="text-[var(--green)]" />
              </div>
            )}
            <div className={cn(
              'max-w-[82%] px-4 py-3 rounded-2xl font-dm text-[14px] leading-relaxed',
              msg.role === 'user'
                ? 'bg-[rgba(0,232,122,0.1)] border border-[rgba(0,232,122,0.18)] text-[var(--text)] rounded-tr-sm'
                : 'bg-[var(--bg3)] border border-[var(--border2)] text-[var(--text2)] rounded-tl-sm',
            )}>
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--bg4)] flex items-center justify-center flex-shrink-0">
              <Bot size={13} className="text-[var(--green)]" />
            </div>
            <div className="bg-[var(--bg3)] border border-[var(--border2)] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--text3)] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--border)] flex-shrink-0">
        <div className="flex gap-2 items-center bg-[var(--bg3)] border border-[var(--border2)] rounded-xl px-4 py-2.5 focus-within:border-[rgba(0,232,122,0.35)] transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask anything about your money…"
            className="flex-1 bg-transparent text-[15px] text-[var(--text)] placeholder:text-[var(--text3)] font-dm outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-50"
            style={{ background: input.trim() ? 'var(--green)' : 'var(--bg4)' }}
          >
            <Send size={14} color={input.trim() ? '#07090f' : 'var(--text3)'} />
          </button>
        </div>
      </div>
    </div>
  )
}
