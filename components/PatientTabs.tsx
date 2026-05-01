'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Ficha', path: 'ficha' },
  { label: 'Mediciones', path: 'mediciones' },
  { label: 'Diario', path: 'diario' },
  { label: 'Consultas', path: 'consultas' },
  { label: 'Planes alimentarios', path: 'planes' },
  { label: 'Referencias lab.', path: 'referencias-lab' },
  { label: 'Documentos', path: 'documentos' },
]

export default function PatientTabs({ patientId }: { patientId: string }) {
  const pathname = usePathname()

  return (
    <div
      className="relative border-b border-border"
      style={{
        // Fade gradient en el borde derecho para indicar scroll horizontal en mobile
        maskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent)',
        WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent)',
      }}
    >
      <nav className="flex gap-1 overflow-x-auto scrollbar-thin">
        {tabs.map(tab => {
          const href = `/patients/${patientId}/${tab.path}`
          const active = pathname === href
          return (
            <Link
              key={tab.path}
              href={href}
              className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors shrink-0 ${
                active
                  ? 'border-sage text-sage font-medium'
                  : 'border-transparent text-graphite-muted hover:text-graphite hover:border-border-strong'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
