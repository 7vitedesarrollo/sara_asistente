'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Ficha', path: 'ficha' },
  { label: 'Mediciones', path: 'mediciones' },
  { label: 'Consultas', path: 'consultas' },
  { label: 'Planes alimentarios', path: 'planes' },
  { label: 'Referencias lab.', path: 'referencias-lab' },
  { label: 'Documentos', path: 'documentos' },
]

export default function PatientTabs({ patientId }: { patientId: string }) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 border-b border-border overflow-x-auto">
      {tabs.map(tab => {
        const href = `/patients/${patientId}/${tab.path}`
        const active = pathname === href
        return (
          <Link
            key={tab.path}
            href={href}
            className={`px-4 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
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
  )
}
