'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--background)] px-4 py-10 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-55"
        aria-hidden="true"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(17,17,17,0.12) 1px, transparent 1px)',
          backgroundSize: '14px 14px',
        }}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl items-center justify-center">
        <section className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-8 shadow-[0_14px_45px_rgba(17,17,17,0.06)] sm:px-10 sm:py-10">
          <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
            Logo
          </div>

          <header className="mb-7 text-center">
            <h1 className="text-3xl font-semibold leading-tight text-[var(--foreground)]">
              Crear cuenta
            </h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Regístrate para acceder al panel administrativo
            </p>
          </header>

          {submitted ? (
            <div className="space-y-4 text-center">
              <p className="text-base font-medium text-[var(--foreground)]">Cuenta creada</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Tu cuenta fue registrada con éxito. Ya puedes iniciar sesión.
              </p>
              <Link
                href="/login"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] transition hover:bg-black"
              >
                Ir a iniciar sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@empresa.com"
                  autoComplete="email"
                  className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)] focus:bg-[var(--surface)] focus:ring-2 focus:ring-black/10"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)] focus:bg-[var(--surface)] focus:ring-2 focus:ring-black/10"
                />
              </div>

              <div>
                <label htmlFor="confirm" className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  Confirmar contraseña
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)] focus:bg-[var(--surface)] focus:ring-2 focus:ring-black/10"
                />
              </div>

              {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-65"
              >
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>

              <p className="text-center text-sm text-[var(--muted-foreground)]">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="font-medium text-[var(--foreground)] underline underline-offset-4 hover:opacity-70">
                  Inicia sesión
                </Link>
              </p>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}
