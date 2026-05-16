import Link from 'next/link'

const CATEGORY_EMOJI: Record<string, string> = {
  toy: '🧸', book: '📚', stationery: '✏️',
  sports: '⚽', clothing: '👕', other: '📦'
}

const CATEGORY_BG: Record<string, string> = {
  toy: 'bg-blue-50', book: 'bg-green-50', stationery: 'bg-yellow-50',
  sports: 'bg-orange-50', clothing: 'bg-purple-50', other: 'bg-gray-50'
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

interface Props {
  item: {
    id: string
    title: string
    price: number
    category: string
    school_name: string | null
    district: string | null
    item_images?: { storage_path: string; display_order: number }[] | null
  }
}

export default function ItemCard({ item }: Props) {
  const images = item.item_images ?? []
  const firstImage = images.sort((a, b) => a.display_order - b.display_order)[0]
  const imageUrl = firstImage
    ? `${SUPABASE_URL}/storage/v1/object/public/item-images/${firstImage.storage_path}`
    : null

  return (
    <Link href={`/child/item/${item.id}`}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm active:scale-95 transition-transform">
      <div className={`h-28 relative overflow-hidden ${CATEGORY_BG[item.category] ?? 'bg-gray-50'}`}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {CATEGORY_EMOJI[item.category] ?? '📦'}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-bold text-sm text-gray-900 truncate">{item.title}</p>
        <p className="font-black text-blue-800 text-base mt-1">
          {item.price.toLocaleString()}원
        </p>
        <p className="text-xs text-gray-500 mt-1">
          🏫 {item.school_name ?? item.district ?? '동네'}
        </p>
      </div>
    </Link>
  )
}
