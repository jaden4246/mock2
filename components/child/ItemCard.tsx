import Link from 'next/link'

const CATEGORY_EMOJI: Record<string, string> = {
  toy: '🧸', book: '📚', stationery: '✏️',
  sports: '⚽', clothing: '👕', other: '📦'
}

const CATEGORY_BG: Record<string, string> = {
  toy: 'bg-blue-50', book: 'bg-green-50', stationery: 'bg-yellow-50',
  sports: 'bg-orange-50', clothing: 'bg-purple-50', other: 'bg-gray-50'
}

interface Props {
  item: {
    id: string
    title: string
    price: number
    category: string
    school_name: string | null
    district: string | null
  }
}

export default function ItemCard({ item }: Props) {
  return (
    <Link href={`/child/item/${item.id}`}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm active:scale-95 transition-transform">
      <div className={`h-28 flex items-center justify-center text-5xl ${CATEGORY_BG[item.category] ?? 'bg-gray-50'}`}>
        {CATEGORY_EMOJI[item.category] ?? '📦'}
      </div>
      <div className="p-3">
        <p className="font-bold text-sm truncate">{item.title}</p>
        <p className="font-black text-blue-800 text-base mt-1">
          {item.price.toLocaleString()}원
        </p>
        <p className="text-xs text-gray-400 mt-1">
          🏫 {item.school_name ?? item.district ?? '동네'}
        </p>
      </div>
    </Link>
  )
}
