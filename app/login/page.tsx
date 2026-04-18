'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/')
  }

  return (
    <main className="flex min-h-screen bg-white">
      {/* ── Left panel (dominant) ── */}
      <section className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-[60%] lg:shrink-0">
        <div className="w-full max-w-[360px]">
          {/* Logo mark */}
          <div className="mb-8 flex justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#366747]">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L15.5 6V12L9 16L2.5 12V6L9 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <h1 className="mb-1 text-center text-2xl font-semibold tracking-tight text-gray-900">
            Bienvenido de nuevo
          </h1>
          <p className="mb-8 text-center text-sm text-gray-500">
            Ingresa a tu cuenta para continuar
          </p>

          {/* Social buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-800 transition hover:bg-gray-50"
            >
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <path d="M15.392 8.56c0-.49-.044-.96-.126-1.414H8.5v2.674h3.864a3.306 3.306 0 01-1.433 2.168v1.8h2.32c1.357-1.25 2.141-3.09 2.141-5.228z" fill="#4285F4"/>
                <path d="M8.5 16c1.94 0 3.567-.643 4.756-1.74l-2.32-1.8c-.643.43-1.464.685-2.436.685-1.873 0-3.458-1.265-4.024-2.965H2.082v1.858A7.497 7.497 0 008.5 16z" fill="#34A853"/>
                <path d="M4.476 10.18A4.507 4.507 0 014.24 8.5c0-.58.1-1.144.236-1.68V4.962H2.082A7.497 7.497 0 001 8.5c0 1.21.29 2.355.802 3.37 0 0-.001 0 0 0l2.674-1.69z" fill="#FBBC05"/>
                <path d="M8.5 3.355c1.054 0 2 .363 2.744 1.074l2.058-2.058C12.063.785 10.437 0 8.5 0A7.497 7.497 0 002.082 4.962L4.756 6.82C5.042 5.12 6.627 3.355 8.5 3.355z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>

            <button
              type="button"
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-800 transition hover:bg-gray-50"
            >
              <svg width="17" height="17" viewBox="0 0 17 17" fill="currentColor">
                <path d="M12.103 1c.077.96-.276 1.916-.847 2.617-.57.7-1.517 1.254-2.44 1.186-.1-.94.303-1.916.843-2.56.563-.674 1.556-1.198 2.444-1.243zm3.397 10.937c-.44.97-.65 1.403-1.213 2.26-.787 1.197-1.897 2.69-3.27 2.7-1.22.01-1.537-.793-3.197-.783-1.66.01-2.01.797-3.233.787-1.374-.01-2.42-1.36-3.207-2.557C-.357 11.677-.44 8.12 1.097 6.21c1.09-1.373 2.8-2.18 4.41-2.18 1.643 0 2.68.8 4.04.8 1.32 0 2.123-.803 4.023-.803 1.447 0 2.98.787 4.067 2.147-3.573 1.96-2.993 7.077.863 5.763z"/>
              </svg>
              Continuar con Apple
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs text-gray-400">o con correo</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-gray-600">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@empresa.com"
                autoComplete="email"
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-medium text-gray-600">
                  Contraseña
                </label>
                <button
                  type="button"
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3.5 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-11 w-full rounded-lg bg-[#2d5c3c] text-sm font-semibold text-white transition hover:bg-[#366747] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link href="/signup" className="font-medium text-[#2d5c3c] hover:underline">
              Regístrate
            </Link>
          </p>

          <div className="mt-8 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="cursor-pointer hover:text-gray-600">Privacidad</span>
            <span className="cursor-pointer hover:text-gray-600">Términos</span>
            <span className="cursor-pointer hover:text-gray-600">Ayuda</span>
          </div>
        </div>
      </section>

      {/* ── Right panel (narrow accent) ── */}
      <aside className="relative hidden flex-1 overflow-hidden lg:flex lg:flex-col lg:items-center lg:justify-center"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%), radial-gradient(circle at 30% 25%, #77ba84 0%, #5fa46f 30%, #366747 65%, #203527 100%)' }}
      >
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")' }}
        />

        <div className="relative z-10 flex flex-col items-center px-12 text-center">
          {/* Logo */}
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
              <path d="M9 2L15.5 6V12L9 16L2.5 12V6L9 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>

          <h2 className="mb-3 text-3xl font-semibold leading-tight tracking-tight text-white xl:text-4xl">
            Controla tus envíos,<br />domina tu negocio.
          </h2>
          <p className="mb-10 max-w-xs text-sm leading-relaxed text-white/55">
            Gestiona pedidos, mensajeros y publicidad desde un solo lugar.
          </p>

          {/* Card */}
          <div
            className="w-full max-w-xs overflow-hidden rounded-2xl border border-white/15 p-5"
            style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(16px)' }}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-xs text-white/45">Pedidos hoy</p>
                <p className="mt-0.5 text-2xl font-semibold text-white">$2,847</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#77ba84" strokeWidth="2">
                  <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                  <path d="M16 3H8L6 7h12l-2-4z"/>
                </svg>
              </div>
            </div>

            <svg viewBox="0 0 240 52" className="w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#77ba84" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#77ba84" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d="M0 40 C30 38, 50 28, 70 30 S110 20, 130 18 S180 8, 200 10 S230 14, 240 12"
                fill="none" stroke="#77ba84" strokeWidth="1.5"/>
              <path d="M0 40 C30 38, 50 28, 70 30 S110 20, 130 18 S180 8, 200 10 S230 14, 240 12 V52 H0 Z"
                fill="url(#gn)"/>
            </svg>

            <div className="mt-3 flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#77ba84" strokeWidth="2.5">
                <polyline points="18 15 12 9 6 15"/>
              </svg>
              <span className="text-xs font-medium text-[#77ba84]">+12.4%</span>
              <span className="text-xs text-white/30">vs ayer</span>
            </div>
          </div>
        </div>

        {/* Bottom dots */}
        <div className="absolute bottom-6 flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-white/25" />
          <span className="h-1 w-4 rounded-full bg-white/60" />
          <span className="h-1 w-1 rounded-full bg-white/25" />
        </div>
      </aside>
    </main>
  )
}
