'use client'
import { createItem } from './actions'
import { useActionState } from 'react'
import { useState, useRef } from 'react'

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
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  return (
    <div className="min-h-screen bg-blue-50">
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
        {/* 사진 업로드 */}
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full"
          >
            {preview ? (
              <div className="relative h-48 rounded-2xl overflow-hidden border-2 border-blue-400">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="미리보기" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  탭해서 변경
                </div>
              </div>
            ) : (
              <div className="h-48 bg-white rounded-2xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center gap-2 hover:border-blue-400 active:bg-blue-50">
                <span className="text-4xl">📸</span>
                <span className="text-sm font-bold text-blue-500">사진 추가하기</span>
                <span className="text-xs text-gray-400">탭해서 사진을 선택하세요</span>
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            name="image"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        <input
          name="title"
          placeholder="물건 이름을 써봐요"
          minLength={2}
          required
          className="bg-white border border-gray-300 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400"
        />

        <textarea
          name="description"
          placeholder="물건 설명을 써봐요 (상태, 특징)"
          rows={3}
          className="bg-white border border-gray-300 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:border-blue-400"
        />

        <div className="bg-white rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-500 mb-2">카테고리</p>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((c, i) => (
              <label key={c.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={c.value}
                  defaultChecked={i === 0}
                  className="sr-only"
                />
                <div className="text-center py-2 px-1 rounded-xl border-2 border-transparent text-sm font-bold text-gray-700 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:checked]:text-blue-700 hover:bg-gray-50">
                  {c.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 flex items-center gap-3">
          <span className="text-sm font-bold text-gray-600">가격</span>
          <input
            name="price"
            type="number"
            placeholder="0"
            min="0"
            max="100000"
            step="100"
            required
            className="flex-1 text-right text-xl font-black text-blue-800 border-none outline-none"
          />
          <span className="font-bold text-gray-600">원</span>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="bg-blue-600 text-white rounded-2xl py-4 font-black text-base disabled:opacity-50"
        >
          {pending ? '등록 중...' : '부모님께 등록 요청하기 ✉️'}
        </button>
      </form>
    </div>
  )
}
