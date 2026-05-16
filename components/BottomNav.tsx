'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  icon: string
  label: string
  href: string
}

export default function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 px-4 z-50 safe-bottom">
      {items.map(n => (
        <Link key={n.href} href={n.href}
          className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
            pathname.startsWith(n.href) ? 'text-blue-600' : 'text-gray-400'
          }`}>
          <span className="text-xl">{n.icon}</span>
          <span>{n.label}</span>
        </Link>
      ))}
    </nav>
  )
}
