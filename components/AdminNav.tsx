'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/admin', label: 'Resumen', icon: '🏠', exact: true },
  { href: '/admin/nutricionistas', label: 'Nutricionistas', icon: '👨‍⚕️' },
  { href: '/admin/users', label: 'Usuarios', icon: '👥' },
]

export default function AdminNav({ adminName }: { adminName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 bg-gray-900 text-gray-100 flex flex-col shrink-0">
      <div className="px-4 py-5 border-b border-gray-700">
        <span className="text-xl font-bold text-white">sara</span>
        <span className="ml-2 text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded font-medium">admin</span>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{adminName}</p>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, label, icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href + '/') || pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-gray-700 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-2 py-4 border-t border-gray-700">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
        >
          <span>↩</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
