'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles, User, StopCircle, Trash2, ChevronDown } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Suggestion {
  label: string
  prompt: string
}

export function AssistantClient({ contexte, suggestions }: {
  contexte: any, suggestions: Suggestion[]
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Bonjour ! Je suis votre assistant IA RestoFlow. 🍽️\n\nJ'ai accès à toutes vos données en temps réel : **stocks**, **food cost**, **planning**, **HACCP**, **prévisions**.\n\nComment puis-je vous aider aujourd'hui ?`,
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput('')
    setLoading(true)

    const controller = new AbortController()
    setAbortController(controller)

    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/ia/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, contexte }),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error('Erreur serveur')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: fullText } : m
        ))
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id
            ? { ...m, content: 'Désolé, une erreur est survenue. Réessayez.' }
            : m
        ))
      }
    } finally {
      setLoading(false)
      setAbortController(null)
    }
  }

  const handleStop = () => {
    abortController?.abort()
    setLoading(false)
  }

  const handleClear = () => {
    setMessages([{
      id: '0', role: 'assistant',
      content: `Bonjour ! Je suis votre assistant IA RestoFlow. 🍽️\n\nComment puis-je vous aider ?`,
      timestamp: new Date(),
    }])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // Formater le markdown simple (escape HTML first to prevent XSS)
  const formatContent = (text: string) => {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
    return escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '• $1')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#e2e8f0' }}>Assistant IA</h1>
            <p className="text-sm" style={{ color: '#4a6fa5' }}>
              Données temps réel · Stocks · Food cost · Planning · HACCP
            </p>
          </div>
        </div>
        <button onClick={handleClear}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{ background: '#1e2d4a', color: '#94a3b8' }}>
          <Trash2 size={14} />Effacer
        </button>
      </div>

      {/* Suggestions */}
      <div className="flex gap-2 flex-wrap mb-4 flex-shrink-0">
        {suggestions.map((s, i) => (
          <button key={i} onClick={() => sendMessage(s.prompt)} disabled={loading}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105"
            style={{
              background: '#0d1526', border: '1px solid #1e2d4a',
              color: '#60a5fa', opacity: loading ? 0.5 : 1
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
              style={{
                background: msg.role === 'assistant'
                  ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                  : 'linear-gradient(135deg, #1d4ed8, #0ea5e9)'
              }}>
              {msg.role === 'assistant'
                ? <Bot size={14} className="text-white" />
                : <User size={14} className="text-white" />}
            </div>

            {/* Bulle */}
            <div className={`max-w-2xl rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
              style={{
                background: msg.role === 'user' ? '#0a1f3d' : '#0d1526',
                border: `1px solid ${msg.role === 'user' ? '#1e3a7a' : '#1e2d4a'}`,
              }}>
              {msg.content === '' && loading ? (
                <div className="flex gap-1 py-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                      style={{ background: '#4f46e5', animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              ) : (
                <div className="text-sm leading-relaxed"
                  style={{ color: msg.role === 'user' ? '#93c5fd' : '#cbd5e1' }}
                  dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
              )}
              <p className="text-xs mt-1.5" style={{ color: '#2d4a7a' }}>
                {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 mt-4">
        <div className="flex gap-3 items-end p-3 rounded-2xl"
          style={{ background: '#0d1526', border: '1px solid #1e2d4a' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez une question sur vos stocks, vos marges, votre planning..."
            rows={1}
            className="flex-1 resize-none outline-none text-sm"
            style={{
              background: 'transparent', color: '#e2e8f0',
              maxHeight: '120px', lineHeight: '1.5',
            }}
          />
          {loading ? (
            <button onClick={handleStop}
              className="p-2.5 rounded-xl flex-shrink-0 transition-all"
              style={{ background: '#1a0505', color: '#f87171' }}>
              <StopCircle size={18} />
            </button>
          ) : (
            <button onClick={() => sendMessage(input)} disabled={!input.trim()}
              className="p-2.5 rounded-xl flex-shrink-0 transition-all"
              style={{
                background: input.trim() ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#1e2d4a',
                color: input.trim() ? 'white' : '#4a6fa5',
              }}>
              <Send size={18} />
            </button>
          )}
        </div>
        <p className="text-xs text-center mt-2" style={{ color: '#1e2d4a' }}>
          Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
        </p>
      </div>
    </div>
  )
}
