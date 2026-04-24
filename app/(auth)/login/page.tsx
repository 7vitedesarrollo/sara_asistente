'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Correo o contraseña incorrectos')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setError('')
        setMode('login')
        alert('Revisa tu correo para confirmar tu cuenta.')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-grid place-items-center w-12 h-12 bg-sage rounded-lg mb-4">
            <span className="font-display italic text-white text-2xl leading-none">S</span>
          </div>
          <h1 className="font-display text-5xl text-graphite leading-none">Sara</h1>
          <p className="text-graphite-muted text-sm mt-3">Asistente para nutricionistas clínicos</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-cream-raised border border-border rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-graphite-muted mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full px-3 py-2.5 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite placeholder:text-graphite-subtle focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-graphite-muted mb-2">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 bg-cream-raised border border-border-strong rounded-md text-sm text-graphite placeholder:text-graphite-subtle focus:outline-none focus:border-sage focus:ring-[3px] focus:ring-sage-bg transition-all"
            />
          </div>

          {error && (
            <p className="text-terracotta text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sage text-white py-2.5 rounded-md text-sm font-medium hover:bg-[#3D6A4A] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Cargando…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>

          <p className="text-center text-sm text-graphite-muted pt-1">
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-sage font-medium hover:underline"
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </form>

        <p className="text-center text-[11px] font-mono uppercase tracking-widest text-graphite-subtle mt-8">
          Para nutricionistas que respetan su criterio.
        </p>
      </div>
    </div>
  )
}
