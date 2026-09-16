import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { api } from './api'
import { setActiveBase } from './client'
import { useApi } from './useApi'
import type { OSConfig, OSInfo } from './types'

export interface Server {
  id: string
  name: string
  apiBase: string
  removable: boolean
}

const DEFAULT_SERVER: Server = {
  id: 'default',
  name: 'AgentOS',
  apiBase: '/api',
  removable: false
}

const LS_SERVERS = 'cp.servers'
const LS_ACTIVE = 'cp.activeServer'

function loadServers(): Server[] {
  try {
    const raw = localStorage.getItem(LS_SERVERS)
    if (!raw) return [DEFAULT_SERVER]
    const extra = JSON.parse(raw) as Server[]
    return [DEFAULT_SERVER, ...extra.filter((s) => s.id !== 'default')]
  } catch {
    return [DEFAULT_SERVER]
  }
}

interface OSState {
  servers: Server[]
  active: Server
  serverKey: string
  setActive: (id: string) => void
  addServer: (name: string, apiBase: string) => void
  removeServer: (id: string) => void
  info: OSInfo | null
  config: OSConfig | null
  approvalsCount: number
  loading: boolean
  error: string | null
  healthy: boolean
  refreshNonce: number
  refresh: () => void
}

const OSContext = createContext<OSState | null>(null)

export function OSProvider({ children }: { children: ReactNode }) {
  const [servers, setServers] = useState<Server[]>(loadServers)
  const [activeId, setActiveId] = useState<string>(
    () => localStorage.getItem(LS_ACTIVE) ?? 'default'
  )
  const [refreshNonce, setNonce] = useState(0)

  const active = useMemo(
    () => servers.find((s) => s.id === activeId) ?? DEFAULT_SERVER,
    [servers, activeId]
  )

  // Keep the API client pointed at the active server before children fetch.
  setActiveBase(active.apiBase)

  useEffect(() => {
    try {
      localStorage.setItem(LS_ACTIVE, active.id)
    } catch {
      // ignore storage failures
    }
  }, [active.id])

  const persist = (next: Server[]) => {
    setServers(next)
    try {
      localStorage.setItem(
        LS_SERVERS,
        JSON.stringify(next.filter((s) => s.removable))
      )
    } catch {
      // ignore storage failures
    }
  }

  const { data, loading, error, reload } = useApi<OSInfo>((s) => {
    setActiveBase(active.apiBase)
    return api.info(s)
  }, [active.id, refreshNonce])

  const config = useApi<OSConfig>((s) => {
    setActiveBase(active.apiBase)
    return api.config(s)
  }, [active.id, refreshNonce])

  const approvals = useApi<{ count: number }>((s) => {
    setActiveBase(active.apiBase)
    return api.approvalsCount(s)
  }, [active.id, refreshNonce])

  const value: OSState = {
    servers,
    active,
    serverKey: active.id,
    setActive: setActiveId,
    addServer: (name, apiBase) =>
      persist([
        ...servers,
        { id: `srv-${Date.now()}`, name, apiBase, removable: true }
      ]),
    removeServer: (id) => {
      persist(servers.filter((s) => s.id !== id))
      if (activeId === id) setActiveId('default')
    },
    info: data,
    config: config.data,
    approvalsCount: approvals.data?.count ?? 0,
    loading,
    error,
    healthy: !error && !!data,
    refreshNonce,
    refresh: () => {
      reload()
      setNonce((n) => n + 1)
    }
  }
  return <OSContext.Provider value={value}>{children}</OSContext.Provider>
}

export function useOS(): OSState {
  const ctx = useContext(OSContext)
  if (!ctx) throw new Error('useOS must be used within OSProvider')
  return ctx
}
