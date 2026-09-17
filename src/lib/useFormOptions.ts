import { useMemo } from 'react'
import { api } from './api'
import { useApi } from './useApi'
import { useOS } from './osContext'
import type { FormOptions } from '@/components/ComponentForm'
import type { RegistryItem } from './types'

// Options for the Studio forms/canvas: available models, buildable tools, and
// existing agents (for team members). Shared by the list (create) and editor.
export function useFormOptions(): FormOptions {
  const { config } = useOS()
  const reg = useApi((s) => api.registry({ limit: 100 }, s), [])
  return useMemo(
    () => ({
      models: config?.available_models ?? [],
      tools: (reg.data?.data ?? [])
        .filter((r: RegistryItem) => r.type === 'tool' || r.type === 'function')
        .map((r: RegistryItem) => r.name),
      agents: (config?.agents ?? []).map((a) => ({ id: a.id, name: a.name }))
    }),
    [config, reg.data]
  )
}
