'use client'
import { signUp } from './actions'
import { useActionState } from 'react'

export default function SignupPage() {
  const [state, action, pending] = useActionState(signUp, null)
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-black text-blue-900 mb-2">아이마켓 보호자 가입</h1>
        <p className="text-gray-500 text-sm mb-6">자녀 계정은 가입 후 추가할 수 있어요</p>
        {state?.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-700 text-sm">
            {state.error}
          </div>
        )}
        <form action={action} className="flex flex-col gap-4">
          <input name="name" type="text" placeholder="보호자 이름"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm" required />
          <input name="email" type="email" placeholder="이메일"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm" required />
          <input name="password" type="password" placeholder="비밀번호 (8자 이상)"
            className="border border-gray-200 rounded-xl px-4 py-3 text-sm"
            minLength={8} required />
          <button type="submit" disabled={pending}
            className="bg-blue-600 text-white rounded-xl py-3 font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
            {pending ? '가입 중...' : '가입하기'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          이미 계정이 있나요? <a href="/login" className="text-blue-600 font-bold">로그인</a>
        </p>
      </div>
    </div>
  )
}
