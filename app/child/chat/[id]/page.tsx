'use client'
import { useEffect, useRef, useState } from 'react'
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

export default function ChatPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [myChildId, setMyChildId] = useState<string>('')
  const [sending, setSending] = useState(false)
  const supabase = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('children').select('id').eq('parent_id', user.id).single()
        .then(({ data }) => data && setMyChildId(data.id))
    })

    supabase.from('messages').select('*')
      .eq('room_id', params.id).order('created_at')
      .then(({ data }) => data && setMessages(data))

    const channel = supabase.channel(`room-${params.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `room_id=eq.${params.id}`
      }, payload => setMessages(prev => [...prev, payload.new as Message]))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [params.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(content: string, type = 'text') {
    if (!content.trim() && type === 'text') return
    setSending(true)
    await fetch('/api/chat', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: params.id, content, msgType: type }),
    })
    setInput('')
    setSending(false)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <a href="/child/home" className="text-gray-400 text-xl">←</a>
        <span className="font-black">채팅</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
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

      <div className="bg-white border-t flex-shrink-0">
        <div className="text-xs text-orange-600 bg-orange-50 px-4 py-2">
          🔒 전화번호·이메일은 자동으로 차단돼요
        </div>
        <div className="flex gap-2 px-4 py-2 overflow-x-auto">
          {STICKERS.map(s => (
            <button key={s} onClick={() => sendMessage(s, 'sticker')}
              className="text-xl flex-shrink-0">
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
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={sending || !input.trim()}
            className="w-9 h-9 bg-blue-600 rounded-full text-white flex items-center justify-center text-lg disabled:opacity-50"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
