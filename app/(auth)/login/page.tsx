'use client'
import { login } from './actions'
import { useActionState } from 'react'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null)
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl">🌱</div>
          <h1 className="text-2xl font-black text-blue-900">아이마켓</h1>
        </div>
        {state?.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-700 text-sm">
            {state.error}
          </div>
        )}
        <form action={action} className="flex flex-col gap-4">
          <input name="email" type="email" placeholder="이메일"
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400" required />
          <input name="password" type="password" placeholder="비밀번호"
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400" required />
          <button type="submit" disabled={pending}
            className="bg-blue-600 text-white rounded-xl py-3 font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
            {pending ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          처음이신가요? <a href="/signup" className="text-blue-600 font-bold">보호자 가입</a>
        </p>
      </div>
    </div>
  )
}
