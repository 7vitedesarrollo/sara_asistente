'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type NavItem = {
  href: string
  label: string
  exact?: boolean
  icon: () => React.ReactElement
}

const navItems: NavItem[] = [
  {
    href: '/admin',
    label: 'Resumen',
    exact: true,
    icon: () => (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l9-9 9 9M5 10v11h14V10" />
      </svg>
    ),
  },
  {
    href: '/admin/nutricionistas',
    label: 'Nutricionistas',
    icon: () => (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </svg>
    ),
  },
  {
    href: '/admin/users',
    label: 'Usuarios',
    icon: () => (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3.5" /><path d="M2 21c0-3 3-5 7-5s7 2 7 5" /><path d="M17 11a3 3 0 100-6M22 21c0-2-1.5-4-4-4.5" />
      </svg>
    ),
  },
]

export default function AdminNav({
  adminName,
  onNavigate,
}: {
  adminName: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 h-full bg-graphite text-cream flex flex-col shrink-0">
      <div className="px-4 py-5 border-b border-[#2A2C29]">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-grid place-items-center w-7 h-7 bg-sage rounded-md font-display italic text-cream text-base leading-none">S</span>
          <span className="font-display text-2xl text-cream leading-none">Sara</span>
          <span className="ml-1 text-[10px] bg-amber text-graphite px-1.5 py-0.5 rounded font-medium font-mono uppercase tracking-widest">admin</span>
        </div>
        <p className="text-xs text-[#A8AAA5] mt-2 truncate font-mono uppercase tracking-wider">{adminName}</p>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href + '/') || pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-[#2A2C29] text-cream font-medium'
                  : 'text-[#A8AAA5] hover:bg-[#1B1E1B] hover:text-cream'
              }`}
            >
              {icon()}
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-2 py-4 border-t border-[#2A2C29]">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-[#A8AAA5] hover:bg-[#1B1E1B] hover:text-cream transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
