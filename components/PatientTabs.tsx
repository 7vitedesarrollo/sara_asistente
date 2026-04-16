'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Atenciones', path: 'atenciones' },
  { label: 'Ficha', path: 'ficha' },
  { label: 'Recetas', path: 'prescriptions' },
  { label: 'Exámenes', path: 'ordenes' },
  { label: 'Certificados', path: 'certificados' },
]

export default function PatientTabs({ patientId }: { patientId: string }) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 border-b border-gray-200 overflow-x-auto">
      {tabs.map(tab => {
        const href = `/patients/${patientId}/${tab.path}`
        const active = pathname === href
        return (
          <Link
            key={tab.path}
            href={href}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              active
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
