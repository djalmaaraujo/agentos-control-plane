import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { apiGet, ApiError, setAuthToken } from '@/lib/client'

type State = 'checking' | 'authed' | 'login'

// Gates the whole app. The API returns 401 when CP_AUTH_TOKEN is set and the
// stored token does not match; anything else (200, or a network error the app's
// own error states handle) counts as passing the gate.
export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>('checking')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const check = useCallback(async () => {
    try {
      await apiGet('/health')
      setState('authed')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setState('login')
      else setState('authed')
    }
  }, [])

  useEffect(() => {
    check()
  }, [check])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setAuthToken(password)
    try {
      await apiGet('/health')
      setState('authed')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAuthToken('')
        setError('Wrong password.')
      } else {
        // Not an auth failure — let the app in and show its own error state.
        setState('authed')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (state === 'checking') {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <Loader2 className="h-5 w-5 animate-spin text-faint" />
      </div>
    )
  }

  if (state === 'login') {
    return (
      <div className="flex h-screen items-center justify-center bg-bg px-4">
        <form
          onSubmit={submit}
          className="w-full max-w-sm rounded-xl border border-border bg-card p-6"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-black">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Control Plane</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-faint">
                AgentOS
              </div>
            </div>
          </div>
          <label className="label mb-1.5 block">Password</label>
          <input
            autoFocus
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-white outline-none focus:border-accent"
            placeholder="••••••••"
          />
          {error && <p className="mt-2 text-[12px] text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !password}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-40"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </button>
        </form>
      </div>
    )
  }

  return <>{children}</>
}
