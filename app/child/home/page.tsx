import { createClient } from '@/lib/supabase/server'
import ItemCard from '@/components/child/ItemCard'

const CATEGORY_LABELS = [
  { value: 'all', label: '전체' },
  { value: 'toy', label: '🧸 장난감' },
  { value: 'book', label: '📚 도서' },
  { value: 'stationery', label: '✏️ 문구' },
  { value: 'sports', label: '⚽ 스포츠' },
  { value: 'clothing', label: '👕 의류' },
]

interface Props {
  searchParams: Promise<{ category?: string; registered?: string }>
}

export default async function ChildHomePage({ searchParams }: Props) {
  const { category, registered } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: child } = await supabase
    .from('children').select('*').eq('parent_id', user!.id).single()

  let query = supabase.from('items').select('*, item_images(storage_path, display_order)').eq('status', 'active')

  if (child?.school_name) {
    query = query.eq('school_name', child.school_name)
  } else if (child?.district) {
    query = query.eq('district', child.district)
  }

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data: items } = await query
    .order('approved_at', { ascending: false })
    .limit(20)

  const currentCategory = category ?? 'all'

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-b from-blue-700 to-blue-500 text-white px-4 pt-5 pb-6">
        {registered && (
          <div className="bg-green-400 text-green-900 text-xs font-bold px-3 py-2 rounded-xl mb-3">
            ✅ 등록 요청 완료! 부모님 승인을 기다리고 있어요
          </div>
        )}
        <p className="text-sm opacity-80">안녕하세요, {child?.nickname ?? '친구'}! 👋</p>
        <h1 className="text-lg font-black mt-1">오늘도 좋은 거래 해봐요</h1>
        <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-bold">
          🌱 씨앗 {child?.seed_points ?? 0}점 · {
            child?.badge_level === 'fruit' ? '🍎 열매' :
            child?.badge_level === 'tree'  ? '🌳 나무' :
            child?.badge_level === 'forest'? '🌲 숲'  : '🌱 새싹'
          } 등급
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
        {CATEGORY_LABELS.map(c => (
          <a key={c.value} href={`/child/home?category=${c.value}`}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
              currentCategory === c.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200'
            }`}>
            {c.label}
          </a>
        ))}
      </div>

      {(items?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center mt-16 text-gray-400 gap-3">
          <span className="text-4xl">🏡</span>
          <p className="font-bold text-sm">아직 등록된 물건이 없어요</p>
          <a href="/child/sell"
            className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold">
            내 물건 팔기
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 mt-1">
          {items?.map(item => <ItemCard key={item.id} item={item} />)}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 px-4">
        {[
          { icon: '🏠', label: '홈', href: '/child/home' },
          { icon: '📦', label: '내 물건', href: '/child/sell' },
        ].map(n => (
          <a key={n.label} href={n.href}
            className="flex flex-col items-center gap-0.5 text-xs text-gray-400">
            <span className="text-xl">{n.icon}</span>{n.label}
          </a>
        ))}
      </nav>
    </div>
  )
}
