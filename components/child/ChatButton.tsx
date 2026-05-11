'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ChatButton({ itemId }: { itemId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleChat() {
    setLoading(true)
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId }),
    })
    const { roomId, error } = await res.json()
    if (error) { alert(error); setLoading(false); return }
    router.push(`/child/chat/${roomId}`)
  }

  return (
    <button
      onClick={handleChat}
      disabled={loading}
      className="w-full bg-blue-600 text-white rounded-2xl py-4 text-center font-black disabled:opacity-50"
    >
      {loading ? '채팅방 만드는 중...' : '채팅으로 구매 문의하기 💬'}
    </button>
  )
}
