'use client'
import { createChild } from './actions'
import { useActionState } from 'react'

const AVATARS = ['lion', 'bear', 'rabbit', 'fox', 'panda', 'tiger']
const AVATAR_EMOJI: Record<string, string> = {
  lion: '🦁',
  bear: '🐻',
  rabbit: '🐰',
  fox: '🦊',
  panda: '🐼',
  tiger: '🐯',
}

export default function NewChildPage() {
  const [state, action, pending] = useActionState(createChild, null)

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-xl font-black text-blue-900 mb-6">자녀 계정 추가</h1>

        {state?.error && (
          <div role="alert" className="bg-red-50 rounded-xl p-3 mb-4 text-red-700 text-sm">
            {state.error}
          </div>
        )}

        <form action={action} className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">캐릭터 선택</p>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((a, i) => (
                <label key={a} className="cursor-pointer">
                  <input
                    type="radio"
                    name="avatar"
                    value={a}
                    defaultChecked={i === 0}
                    className="sr-only"
                  />
                  <div className="text-2xl text-center p-2 rounded-xl border-2 border-transparent hover:border-blue-300 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                    {AVATAR_EMOJI[a]}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="nickname" className="text-xs font-bold text-gray-500 block mb-1">
              닉네임 *
            </label>
            <input
              id="nickname"
              name="nickname"
              placeholder="예: 사자왕"
              minLength={2}
              maxLength={10}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400"
              required
            />
          </div>

          <div>
            <label htmlFor="school_name" className="text-xs font-bold text-gray-500 block mb-1">
              학교 이름
            </label>
            <input
              id="school_name"
              name="school_name"
              placeholder="예: 한강초등학교"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label htmlFor="grade" className="text-xs font-bold text-gray-500 block mb-1">
              학년
            </label>
            <select
              id="grade"
              name="grade"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400"
              defaultValue="3"
            >
              {[1, 2, 3, 4, 5, 6].map((g) => (
                <option key={g} value={g}>
                  {g}학년
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="district" className="text-xs font-bold text-gray-500 block mb-1">
              동네
            </label>
            <input
              id="district"
              name="district"
              placeholder="예: 마포구 합정동"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="bg-blue-600 text-white rounded-xl py-3 font-bold text-sm disabled:opacity-50"
          >
            {pending ? '추가 중...' : '자녀 추가하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
