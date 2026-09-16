import { useEffect, useState } from 'react'
import { useOS } from './osContext'
import { ApiError } from './client'
import type { Paginated } from './types'

interface Options {
  limit?: number
  params?: Record<string, unknown>
  enabled?: boolean
}

interface Result<T> {
  rows: T[]
  meta: Paginated<T>['meta'] | null
  loading: boolean
  error: string | null
  page: number
  setPage: (p: number) => void
  reload: () => void
}

// Paginated list bound to the active server. Refetches on server switch, global
// refresh, page change, or any param change (params are keyed by JSON).
export function usePaginatedList<T>(
  fetcher: (
    params: Record<string, unknown>,
    signal: AbortSignal
  ) => Promise<Paginated<T>>,
  { limit = 25, params = {}, enabled = true }: Options = {}
): Result<T> {
  const { serverKey, refreshNonce } = useOS()
  const [page, setPage] = useState(1)
  const [tick, setTick] = useState(0)
  const [state, setState] = useState<{
    rows: T[]
    meta: Paginated<T>['meta'] | null
    loading: boolean
    error: string | null
  }>({ rows: [], meta: null, loading: true, error: null })

  const paramsKey = JSON.stringify(params)

  // Reset to page 1 whenever the filters or the server change.
  useEffect(() => setPage(1), [paramsKey, serverKey])

  useEffect(() => {
    if (!enabled) {
      setState({ rows: [], meta: null, loading: false, error: null })
      return
    }
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true, error: null }))
    fetcher({ ...params, page, limit }, controller.signal)
      .then((res) =>
        setState({
          rows: res.data ?? [],
          meta: res.meta ?? null,
          loading: false,
          error: null
        })
      )
      .catch((err) => {
        if (controller.signal.aborted) return
        const message =
          err instanceof ApiError
            ? err.status === 401 || err.status === 403
              ? 'Not authorized — check the OS security key.'
              : err.message || `Request failed (${err.status})`
            : 'Could not reach the AgentOS runtime.'
        setState({ rows: [], meta: null, loading: false, error: message })
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, page, limit, serverKey, refreshNonce, tick, enabled])

  return {
    ...state,
    page,
    setPage,
    reload: () => setTick((t) => t + 1)
  }
}
