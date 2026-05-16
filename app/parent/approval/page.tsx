import { createClient } from '@/lib/supabase/server'
import { approveItem, rejectItem } from './actions'

const CATEGORY_EMOJI: Record<string, string> = {
  toy: '🧸', book: '📚', stationery: '✏️',
  sports: '⚽', clothing: '👕', other: '📦'
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

function getPublicImageUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/item-images/${path}`
}

export default async function ApprovalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: children } = await supabase
    .from('children').select('id').eq('parent_id', user!.id)

  const childIds = children?.map(c => c.id) ?? []

  const { data: pendingItems } = await supabase
    .from('items')
    .select('*, children(nickname, avatar), item_images(storage_path, display_order)')
    .in('seller_child_id', childIds.length > 0 ? childIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-4 flex items-center gap-3">
        <a href="/parent/dashboard" className="text-gray-500 text-xl">←</a>
        <h1 className="font-black text-lg text-gray-900">등록 승인 요청</h1>
        {(pendingItems?.length ?? 0) > 0 && (
          <span className="ml-auto bg-yellow-400 text-yellow-900 text-xs font-black px-2 py-1 rounded-full">
            {pendingItems!.length}건
          </span>
        )}
      </div>

      {(pendingItems?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
          <span className="text-5xl mb-3">✅</span>
          <p className="font-bold">대기 중인 요청이 없어요</p>
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-4">
          {pendingItems?.map(item => {
            const images = (item.item_images as { storage_path: string; display_order: number }[] | null) ?? []
            const firstImage = images.sort((a, b) => a.display_order - b.display_order)[0]
            const imageUrl = firstImage ? getPublicImageUrl(firstImage.storage_path) : null

            return (
              <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                {/* 상품 이미지 또는 이모지 */}
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-50 flex items-center justify-center text-6xl">
                      {CATEGORY_EMOJI[item.category] ?? '📦'}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-1">
                    {(item.children as { nickname: string } | null)?.nickname ?? '자녀'} 의 물건
                  </p>
                  <h3 className="font-black text-base text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-blue-700 font-black text-xl mb-1">
                    {item.price.toLocaleString()}원
                  </p>
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  )}
                  <div className="flex gap-3 mt-3">
                    <form action={rejectItem}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <button type="submit"
                        className="border-2 border-red-400 text-red-600 font-bold rounded-xl py-3 px-6 text-sm active:bg-red-50">
                        ✕ 거부
                      </button>
                    </form>
                    <form action={approveItem} className="flex-1">
                      <input type="hidden" name="itemId" value={item.id} />
                      <button type="submit"
                        className="w-full bg-green-500 text-white rounded-xl py-3 font-black text-sm active:bg-green-600">
                        ✓ 승인하기
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
