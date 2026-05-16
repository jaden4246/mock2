import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const BADGE_LABEL: Record<string, string> = {
  sprout: '🌱 새싹', fruit: '🍎 열매', tree: '🌳 나무', forest: '🌲 숲'
}

export default async function ParentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: children } = await supabase
    .from('children').select('*').eq('parent_id', user!.id)

  const child = children?.[0]
  const childIds = children?.map(c => c.id) ?? []
  const safeIds = childIds.length > 0 ? childIds : ['00000000-0000-0000-0000-000000000000']

  const [{ data: pendingItems }, { data: recentTrades }] = await Promise.all([
    supabase.from('items').select('id').in('seller_child_id', safeIds).eq('status', 'pending'),
    supabase.from('trades').select('id').in('seller_child_id', safeIds),
  ])

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-blue-800 text-white p-5">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs opacity-75 mb-1">보호자 대시보드</p>
            <h1 className="text-lg font-black">{child?.nickname ?? '자녀'} 님의 활동</h1>
          </div>
          {(pendingItems?.length ?? 0) > 0 && (
            <Link href="/parent/approval"
              className="bg-yellow-400 text-yellow-900 rounded-full w-8 h-8 flex items-center justify-center text-sm font-black">
              {pendingItems!.length}
            </Link>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-blue-700 rounded-xl p-3 text-center">
            <div className="text-lg font-black">{child?.seed_points ?? 0}</div>
            <div className="text-xs opacity-75">씨앗 포인트</div>
          </div>
          <div className="bg-blue-700 rounded-xl p-3 text-center">
            <div className="text-lg font-black">{recentTrades?.length ?? 0}</div>
            <div className="text-xs opacity-75">총 거래</div>
          </div>
          <div className="bg-blue-700 rounded-xl p-3 text-center">
            <div className="text-sm font-black">
              {BADGE_LABEL[child?.badge_level ?? 'sprout']}
            </div>
            <div className="text-xs opacity-75">등급</div>
          </div>
        </div>
      </div>

      {(pendingItems?.length ?? 0) > 0 && (
        <Link href="/parent/approval"
          className="mx-4 mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-2xl flex items-center gap-3 block">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-black text-sm">승인 대기 {pendingItems!.length}건</p>
            <p className="text-xs text-gray-500">탭해서 확인하세요</p>
          </div>
          <span className="ml-auto text-blue-500">→</span>
        </Link>
      )}

      {!child && (
        <div className="mx-4 mt-4 p-6 bg-white rounded-2xl text-center">
          <p className="text-3xl mb-2">👶</p>
          <p className="font-bold mb-3">자녀 계정을 추가해주세요</p>
          <Link href="/parent/children/new"
            className="inline-block bg-blue-600 text-white rounded-xl px-6 py-2 text-sm font-bold">
            자녀 추가하기
          </Link>
        </div>
      )}

      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <Link href="/parent/approval"
          className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm text-center">
          <div className="text-2xl mb-1">✅</div>
          <p className="text-sm font-bold text-gray-800">승인 관리</p>
        </Link>
        <Link href="/parent/children/new"
          className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm text-center">
          <div className="text-2xl mb-1">➕</div>
          <p className="text-sm font-bold text-gray-800">자녀 추가</p>
        </Link>
      </div>

      {child && (
        <div className="mx-4 mt-3">
          <p className="text-xs font-bold text-gray-400 mb-2 px-1">아이 화면 바로가기</p>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/child/home"
              className="bg-blue-50 rounded-2xl p-4 border border-blue-100 text-center">
              <div className="text-2xl mb-1">🏠</div>
              <p className="text-sm font-bold text-blue-700">아이 홈</p>
            </Link>
            <Link href="/child/sell"
              className="bg-green-50 rounded-2xl p-4 border border-green-100 text-center">
              <div className="text-2xl mb-1">📦</div>
              <p className="text-sm font-bold text-green-700">상품 등록</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
