import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Rutas públicas
  if (pathname.startsWith('/login') || pathname.startsWith('/auth')) {
    if (user) {
      // Redirigir según rol
      const { data: profile } = await supabase
        .from('doctors')
        .select('role')
        .eq('id', user.id)
        .single()
      const dest = profile?.role === 'admin' ? '/admin' : '/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return supabaseResponse
  }

  // Todo lo demás requiere auth
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Doctor intentando acceder a rutas de admin → redirigir
  if (pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('doctors')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Admin intentando acceder a rutas de doctor → permitir (admin puede ver todo)

  return supabaseResponse
}
