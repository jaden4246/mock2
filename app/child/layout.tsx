import BottomNav from '@/components/BottomNav'

const CHILD_NAV = [
  { icon: '🏠', label: '홈', href: '/child/home' },
  { icon: '📦', label: '판매하기', href: '/child/sell' },
  { icon: '👨‍👩‍👧', label: '보호자', href: '/parent/dashboard' },
]

export default function ChildLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-16">
      {children}
      <BottomNav items={CHILD_NAV} />
    </div>
  )
}
