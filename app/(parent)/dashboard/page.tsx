import Link from 'next/link'

export default function ParentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <p className="text-gray-500">보호자 대시보드 (Task 7에서 완성)</p>
      <Link
        href="/parent/children/new"
        className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold"
      >
        자녀 추가하기
      </Link>
    </div>
  )
}
