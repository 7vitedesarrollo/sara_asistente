'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import NutriNav from './NutriNav'

export default function NutriShell({
  nutritionistName,
  children,
}: {
  nutritionistName: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Cierra el drawer al cambiar de ruta (mobile UX)
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Lock scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      {/* Sidebar — fixed en mobile (slide in/out), inline en desktop */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-out
          md:relative md:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <NutriNav
          nutritionistName={nutritionistName}
          onNavigate={() => setOpen(false)}
        />
      </div>

      {/* Backdrop — solo mobile, cuando open */}
      {open && (
        <button
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-graphite/40 md:hidden"
        />
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar — solo mobile */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-cream-raised shrink-0">
          <button
            aria-label="Abrir menú"
            onClick={() => setOpen(true)}
            className="p-2 -ml-2 rounded-md text-graphite hover:bg-cream-sunken transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="inline-grid place-items-center w-6 h-6 bg-sage rounded font-display italic text-white text-sm leading-none">S</span>
            <span className="font-display text-lg text-graphite leading-none">Sara</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
