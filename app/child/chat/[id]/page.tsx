'use client'
import { use, useEffect, useRef, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

const STICKERS = ['😊', '👍', '🤔', '🎉', '💰', '🙏', '😅', '❤️']

interface Message {
  id: string
  content: string
  msg_type: string
  sender_child_id: string
  created_at: string
  is_flagged: boolean
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = use(params)
  const supabase = useMemo(() => createClient(), [])

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [myChildId, setMyChildId] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load child ID + message history + subscribe to realtime
  useEffect(() => {
    let cancelled = false

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data: child } = await supabase
        .from('children').select('id').eq('parent_id', user.id).single()
      if (!cancelled && child) setMyChildId(child.id)

      const { data: msgs, error: msgsErr } = await supabase
        .from('messages').select('*')
        .eq('room_id', roomId).order('created_at')
      if (!cancelled) {
        if (msgsErr) setError('메시지를 불러오지 못했어요')
        else setMessages(msgs ?? [])
      }
    }

    init()

    const channel = supabase.channel(`room-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      }, payload => {
        if (!cancelled) setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(content: string, type = 'text') {
    if (!content.trim() && type === 'text') return
    setSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, content, msgType: type }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? '전송 실패')
      }
    } catch {
      setError('전송 중 오류가 발생했어요')
    }
    setInput('')
    setSending(false)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <a href="/child/home" className="text-gray-500 text-xl leading-none">←</a>
        <span className="font-black text-gray-900">채팅</span>
      </div>

      {error && (
        <div className="mx-4 mt-2 bg-red-50 text-red-600 text-xs rounded-xl p-2 text-center">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 mt-8">
            대화를 시작해보세요! 👋
          </p>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_child_id === myChildId
          return (
            <div key={msg.id}
              className={`flex gap-2 max-w-[80%] ${isMe ? 'self-end flex-row-reverse' : 'self-start'}`}>
              {!isMe && (
                <div className="w-7 h-7 rounded-full bg-orange-300 flex-shrink-0 flex items-center justify-center text-sm">
                  🦁
                </div>
              )}
              <div className={`px-3 py-2 rounded-2xl text-sm ${
                isMe
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : 'bg-white text-gray-800 rounded-tl-sm shadow-sm'
              }`}>
                {msg.is_flagged && (
                  <span className="text-xs opacity-75 block mb-1">⚠️ 일부 정보가 차단됐어요</span>
                )}
                {msg.msg_type === 'sticker'
                  ? <span className="text-2xl">{msg.content}</span>
                  : msg.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="bg-white border-t flex-shrink-0">
        <div className="text-xs text-orange-600 bg-orange-50 px-4 py-2">
          🔒 전화번호·이메일은 자동으로 차단돼요
        </div>
        <div className="flex gap-3 px-4 py-2 overflow-x-auto">
          {STICKERS.map(s => (
            <button key={s} onClick={() => sendMessage(s, 'sticker')}
              className="text-2xl flex-shrink-0 active:scale-125 transition-transform">
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2 px-4 py-3 border-t">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="메시지를 입력하세요..."
            disabled={sending}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={sending || !input.trim()}
            className="w-10 h-10 bg-blue-600 rounded-full text-white flex items-center justify-center text-xl disabled:opacity-40 active:scale-95"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
