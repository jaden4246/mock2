import BottomNav from '@/components/BottomNav'

const PARENT_NAV = [
  { icon: '🏠', label: '대시보드', href: '/parent/dashboard' },
  { icon: '✅', label: '승인', href: '/parent/approval' },
  { icon: '👶', label: '자녀 추가', href: '/parent/children/new' },
  { icon: '👧', label: '아이 화면', href: '/child/home' },
]

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-16">
      {children}
      <BottomNav items={PARENT_NAV} />
    </div>
  )
}
