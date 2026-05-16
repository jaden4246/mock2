import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ChatButton from '@/components/child/ChatButton'

const CATEGORY_EMOJI: Record<string, string> = {
  toy: '🧸', book: '📚', stationery: '✏️',
  sports: '⚽', clothing: '👕', other: '📦'
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function ItemDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('items').select('*, children(nickname, avatar), item_images(storage_path, display_order)')
    .eq('id', id).eq('status', 'active').single()

  if (!item) notFound()

  const images = (item.item_images as { storage_path: string; display_order: number }[] | null) ?? []
  const firstImage = images.sort((a, b) => a.display_order - b.display_order)[0]
  const imageUrl = firstImage
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-images/${firstImage.storage_path}`
    : null

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link href="/child/home" className="text-gray-500 text-xl">←</Link>
        <span className="font-black">상품 상세</span>
      </div>

      <div className="h-56 relative overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-blue-50 flex items-center justify-center text-8xl">
            {CATEGORY_EMOJI[item.category] ?? '📦'}
          </div>
        )}
      </div>

      <div className="bg-white p-5 mx-4 mt-4 rounded-2xl shadow-sm">
        <h1 className="text-xl font-black mb-2">{item.title}</h1>
        <p className="text-3xl font-black text-blue-800 mb-4">
          {item.price.toLocaleString()}원
        </p>
        {item.description && (
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">{item.description}</p>
        )}
        <div className="text-xs text-gray-400 flex gap-4">
          <span>🏫 {item.school_name ?? item.district ?? '동네'}</span>
          <span>📅 {new Date(item.approved_at ?? item.created_at).toLocaleDateString('ko-KR')}</span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <ChatButton itemId={item.id} />
      </div>
    </div>
  )
}
