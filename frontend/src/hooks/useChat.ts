import { useState, useCallback } from 'react'
import { aiApi } from '@/lib/axios'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface UseChatOptions {
  transactionsContext?: object[]
  contextType?: 'transactions' | 'stock_research'
}

interface UseChatResult {
  messages: ChatMessage[]
  sendMessage: (content: string) => Promise<void>
  isTyping: boolean
  error: string | null
  clearMessages: () => void
}

function timestamp(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function useChat(options: UseChatOptions = {}): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (content: string) => {
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: timestamp(),
      }

      setMessages((prev) => [...prev, userMsg])
      setIsTyping(true)
      setError(null)

      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))

      try {
        const token = await window.Clerk?.session?.getToken()
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const baseURL = import.meta.env.VITE_AI_API ?? 'http://localhost:3002'
        const res = await fetch(`${baseURL}/api/chat/stream`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            messages: history,
            transactions_context: options.transactionsContext ?? [],
            context_type: options.contextType ?? 'transactions',
          }),
        })

        if (!res.ok) throw new Error(`Chat failed: ${res.status}`)

        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '',
          timestamp: timestamp(),
        }

        setMessages((prev) => [...prev, aiMsg])

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const text = decoder.decode(value)
            const lines = text.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                const chunk = line.slice(6)
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsg.id ? { ...m, content: m.content + chunk } : m,
                  ),
                )
              }
            }
          }
        }
      } catch {
        try {
          const { data } = await aiApi.post('/api/chat', {
            messages: history,
            transactions_context: options.transactionsContext ?? [],
            context_type: options.contextType ?? 'transactions',
          })

          const aiMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.message,
            timestamp: timestamp(),
          }
          setMessages((prev) => [...prev, aiMsg])
        } catch (fallbackErr: unknown) {
          setError(fallbackErr instanceof Error ? fallbackErr.message : 'Chat failed')
        }
      } finally {
        setIsTyping(false)
      }
    },
    [messages, options.transactionsContext, options.contextType],
  )

  const clearMessages = useCallback(() => setMessages([]), [])

  return { messages, sendMessage, isTyping, error, clearMessages }
}
