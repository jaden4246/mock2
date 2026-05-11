'use client'
import { createItem } from './actions'
import { useActionState } from 'react'

const CATEGORIES = [
  { value: 'toy', label: '🧸 장난감' },
  { value: 'book', label: '📚 도서' },
  { value: 'stationery', label: '✏️ 문구' },
  { value: 'sports', label: '⚽ 스포츠' },
  { value: 'clothing', label: '👕 의류' },
  { value: 'other', label: '📦 기타' },
]

export default function SellPage() {
  const [state, action, pending] = useActionState(createItem, null)
  return (
    <div className="min-h-screen bg-blue-50 pb-20">
      <div className="bg-blue-700 text-white p-4">
        <h1 className="text-lg font-black">내 물건 팔기</h1>
        <p className="text-sm opacity-75">사진을 찍고 설명을 쓰면 부모님이 확인해요</p>
      </div>
      {state?.error && (
        <div role="alert" className="mx-4 mt-4 bg-red-50 rounded-xl p-3 text-red-700 text-sm">
          {state.error}
        </div>
      )}
      <form action={action} className="flex flex-col gap-4 p-4">
        <label className="block cursor-pointer">
          <div className="h-40 bg-white rounded-2xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center gap-2 hover:border-blue-400">
            <span className="text-3xl">📸</span>
            <span className="text-sm text-gray-400">사진 추가하기</span>
          </div>
          <input type="file" name="image" accept="image/*" className="sr-only" />
        </label>

        <input name="title" placeholder="물건 이름을 써봐요" minLength={2} required
          className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm" />

        <textarea name="description" placeholder="물건 설명을 써봐요 (상태, 특징)"
          rows={3} className="bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm resize-none" />

        <div className="bg-white rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-500 mb-2">카테고리</p>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c, i) => (
              <label key={c.value} className="cursor-pointer">
                <input type="radio" name="category" value={c.value}
                  defaultChecked={i === 0} className="sr-only" />
                <div className="text-center py-2 px-1 rounded-xl border-2 border-transparent text-sm font-medium has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 hover:bg-gray-50">
                  {c.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 flex items-center gap-3">
          <span className="text-sm font-bold text-gray-600">가격</span>
          <input name="price" type="number" placeholder="0" min="0" max="100000" step="100" required
            className="flex-1 text-right text-xl font-black text-blue-800 border-none outline-none" />
          <span className="font-bold text-gray-600">원</span>
        </div>

        <button type="submit" disabled={pending}
          className="bg-blue-600 text-white rounded-2xl py-4 font-black text-base disabled:opacity-50">
          {pending ? '등록 중...' : '부모님께 등록 요청하기 ✉️'}
        </button>
      </form>
    </div>
  )
}
