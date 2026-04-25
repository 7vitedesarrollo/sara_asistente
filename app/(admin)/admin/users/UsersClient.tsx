'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type User = {
  id: string
  name: string
  email: string
  role: 'admin' | 'nutritionist'
  specialization: string | null
  created_at: string
}

export default function UsersClient({ users: initial }: { users: User[] }) {
  const supabase = createClient()
  const [users, setUsers] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)

  async function toggleRole(user: User) {
    const newRole = user.role === 'admin' ? 'nutritionist' : 'admin'
    setLoading(user.id)

    const { error } = await supabase
      .from('nutritionists')
      .update({ role: newRole })
      .eq('id', user.id)

    if (error) {
      toast.error('Error al cambiar el rol')
    } else {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u))
      toast.success(`${user.name} ahora es ${newRole === 'admin' ? 'administrador' : 'médico'}`)
    }
    setLoading(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-graphite">Usuarios</h1>
        <p className="text-sm text-graphite-subtle mt-1">Gestiona roles de acceso a la plataforma</p>
      </div>

      <div className="bg-cream-raised border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream-sunken">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-graphite-subtle">Usuario</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-graphite-subtle">Rol actual</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-graphite-subtle">Registrado</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-graphite-subtle">Acción</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-gray-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-graphite">{u.name}</p>
                  <p className="text-xs text-graphite-subtle">{u.email}</p>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    u.role === 'admin'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-sage-bg text-sage'
                  }`}>
                    {u.role === 'admin' ? 'Administrador' : 'Médico'}
                  </span>
                </td>
                <td className="px-5 py-3 text-graphite-subtle text-xs">
                  {new Date(u.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => toggleRole(u)}
                    disabled={loading === u.id}
                    className="text-xs text-graphite-muted hover:text-graphite underline disabled:opacity-40"
                  >
                    {loading === u.id
                      ? 'Cambiando...'
                      : u.role === 'admin' ? 'Cambiar a médico' : 'Hacer admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
