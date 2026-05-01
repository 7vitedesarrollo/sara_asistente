'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type NavItem = {
  href: string
  label: string
  icon: (active: boolean) => React.ReactElement
}

const stroke = (active: boolean) => active ? 'var(--sage)' : 'currentColor'

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Hoy',
    icon: (a) => (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={stroke(a)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l9-9 9 9M5 10v11h14V10" />
      </svg>
    ),
  },
  {
    href: '/appointments',
    label: 'Agenda',
    icon: (a) => (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={stroke(a)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: '/analytics',
    label: 'Métricas',
    icon: (a) => (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={stroke(a)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20V6a2 2 0 012-2h12a2 2 0 012 2v14M4 20l8-6 8 6" />
      </svg>
    ),
  },
  {
    href: '/plantillas',
    label: 'Plantillas',
    icon: (a) => (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={stroke(a)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    href: '/sara',
    label: 'Sara IA',
    icon: (a) => (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={stroke(a)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Ajustes',
    icon: (a) => (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={stroke(a)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M12 1v6M12 17v6M1 12h6M17 12h6M5 5l4 4M15 15l4 4M5 19l4-4M15 9l4-4" />
      </svg>
    ),
  },
]

export default function NutriNav({
  nutritionistName,
  onNavigate,
}: {
  nutritionistName: string
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
    <aside className="w-60 h-full bg-cream-sunken border-r border-border flex flex-col shrink-0">
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="inline-grid place-items-center w-7 h-7 bg-sage rounded-md font-display italic text-white text-base leading-none">S</span>
          <span className="font-display text-2xl text-graphite leading-none">Sara</span>
        </div>
        <p className="text-xs text-graphite-subtle mt-2 truncate font-mono uppercase tracking-wider">
          {nutritionistName}
        </p>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-sage-bg text-sage font-medium'
                  : 'text-graphite-muted hover:bg-cream hover:text-graphite'
              }`}
            >
              {icon(active)}
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-2 py-4 border-t border-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-graphite-muted hover:bg-cream hover:text-graphite transition-colors"
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
