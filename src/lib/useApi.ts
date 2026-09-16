import { useEffect, useState } from 'react'
import { ApiError } from './api'

interface State<T> {
  data: T | null
  error: string | null
  loading: boolean
}

// Minimal fetch-on-mount hook with abort + a manual reload counter. Enough for
// the read-mostly control plane; swap for a cache lib if data grows shared.
export function useApi<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = []
): State<T> & { reload: () => void } {
  const [tick, setTick] = useState(0)
  const [state, setState] = useState<State<T>>({
    data: null,
    error: null,
    loading: true
  })

  useEffect(() => {
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true, error: null }))
    fetcher(controller.signal)
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((err) => {
        if (controller.signal.aborted) return
        const message =
          err instanceof ApiError
            ? err.status === 401 || err.status === 403
              ? 'Not authorized — check the OS security key.'
              : `Request failed (${err.status})`
            : 'Could not reach the AgentOS runtime.'
        setState({ data: null, error: message, loading: false })
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { ...state, reload: () => setTick((t) => t + 1) }
}
