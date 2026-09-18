import { apiForm, apiGet, apiJson } from './client'
import type {
  Approval,
  Component,
  ComponentConfig,
  ComponentDetail,
  ComponentRef,
  ComponentType,
  DailyMetric,
  EvalRun,
  KnowledgeContent,
  KnowledgeSearchResult,
  Learning,
  Memory,
  MetricsResponse,
  OSConfig,
  OSInfo,
  Paginated,
  RegistryItem,
  Schedule,
  ScheduleRun,
  ServiceAccount,
  Session,
  Trace,
  TraceDetail,
  TraceFilterSchema,
  TraceSessionStat
} from './types'

export { ApiError } from './client'

type Q = Record<string, unknown>

const runBase = (type: 'agent' | 'team' | 'workflow') =>
  type === 'team' ? 'teams' : type === 'workflow' ? 'workflows' : 'agents'

export const api = {
  info: (s?: AbortSignal) => apiGet<OSInfo>('/info', undefined, s),
  config: (s?: AbortSignal) => apiGet<OSConfig>('/config', undefined, s),
  health: (s?: AbortSignal) =>
    apiGet<{ status?: string }>('/health', undefined, s),

  sessions: (q: Q, s?: AbortSignal) =>
    apiGet<Paginated<Session>>('/sessions', q, s),
  sessionRuns: (id: string, s?: AbortSignal) =>
    apiGet<unknown>(`/sessions/${id}/runs`, undefined, s),
  renameSession: (id: string, name: string, type?: string) =>
    apiJson(
      `/sessions/${id}/rename${type ? `?type=${type}` : ''}`,
      'POST',
      { session_name: name }
    ),
  deleteSession: (id: string) => apiJson(`/sessions/${id}`, 'DELETE'),
  forkSession: (type: 'agent' | 'team', componentId: string, sessionId: string) =>
    apiJson<{ session_id?: string }>(
      `/${type === 'team' ? 'teams' : 'agents'}/${componentId}/sessions/${sessionId}/fork`,
      'POST'
    ),
  cancelRun: (
    type: 'agent' | 'team' | 'workflow',
    id: string,
    runId: string,
    sessionId?: string
  ) =>
    apiJson(
      `/${runBase(type)}/${id}/runs/${runId}/cancel${sessionId ? `?session_id=${sessionId}` : ''}`,
      'POST'
    ),

  traces: (q: Q, s?: AbortSignal) => apiGet<Paginated<Trace>>('/traces', q, s),
  traceFilterSchema: (s?: AbortSignal) =>
    apiGet<TraceFilterSchema>('/traces/filter-schema', undefined, s),
  tracesSearch: (
    body: { filter?: unknown; page?: number; limit?: number },
    s?: AbortSignal
  ) => apiJson<Paginated<Trace>>('/traces/search', 'POST', body, s),
  trace: (id: string, s?: AbortSignal) =>
    apiGet<TraceDetail>(`/traces/${id}`, undefined, s),
  traceSessionStats: (q: Q, s?: AbortSignal) =>
    apiGet<Paginated<TraceSessionStat>>('/trace_session_stats', q, s),

  memories: (q: Q, s?: AbortSignal) =>
    apiGet<Paginated<Memory>>('/memories', q, s),
  memoryTopics: (s?: AbortSignal) => apiGet<string[]>('/memory_topics', undefined, s),
  deleteMemory: (id: string) => apiJson(`/memories/${id}`, 'DELETE'),
  optimizeMemories: () => apiJson('/optimize-memories', 'POST'),
  createMemory: (body: { memory: string; user_id?: string; topics?: string[] }) =>
    apiJson('/memories', 'POST', body),
  updateMemory: (
    id: string,
    body: { memory: string; user_id?: string; topics?: string[] }
  ) => apiJson(`/memories/${id}`, 'PATCH', body),

  metrics: (q: Q, s?: AbortSignal) => apiGet<MetricsResponse>('/metrics', q, s),
  refreshMetrics: () => apiJson('/metrics/refresh', 'POST'),

  evalRuns: (q: Q, s?: AbortSignal) =>
    apiGet<Paginated<EvalRun>>('/eval-runs', q, s),
  createEvalRun: (body: {
    eval_type: string
    input: string
    agent_id?: string
    team_id?: string
    name?: string
    num_iterations?: number
    expected_output?: string
    criteria?: string
    additional_guidelines?: string
    scoring_strategy?: 'numeric' | 'binary'
    expected_tool_calls?: string[]
  }) => apiJson<EvalRun>('/eval-runs', 'POST', body),
  deleteEvalRun: (id: string) =>
    apiJson('/eval-runs', 'DELETE', { eval_run_ids: [id] }),

  schedules: (q: Q, s?: AbortSignal) =>
    apiGet<Paginated<Schedule>>('/schedules', q, s),
  updateSchedule: (
    id: string,
    body: {
      name?: string
      cron_expr?: string
      timezone?: string
      description?: string
      payload?: Record<string, unknown>
    }
  ) => apiJson(`/schedules/${id}`, 'PATCH', body),
  enableSchedule: (id: string) => apiJson(`/schedules/${id}/enable`, 'POST'),
  disableSchedule: (id: string) => apiJson(`/schedules/${id}/disable`, 'POST'),
  triggerSchedule: (id: string) => apiJson(`/schedules/${id}/trigger`, 'POST'),
  scheduleRuns: (id: string, q: Q, s?: AbortSignal) =>
    apiGet<Paginated<ScheduleRun>>(`/schedules/${id}/runs`, q, s),
  createSchedule: (body: {
    name: string
    cron_expr: string
    endpoint: string
    method?: string
    description?: string
    payload?: Record<string, unknown>
    timezone?: string
  }) => apiJson('/schedules', 'POST', body),

  serviceAccounts: (q: Q, s?: AbortSignal) =>
    apiGet<Paginated<ServiceAccount>>('/service-accounts', q, s),
  createServiceAccount: (body: {
    name: string
    scopes?: { scope: string; effect: 'allow' }[]
    never_expires?: boolean
    expires_in_days?: number
    allow_privileged_scopes?: boolean
  }) => apiJson<ServiceAccount>('/service-accounts', 'POST', body),
  deleteServiceAccount: (id: string) =>
    apiJson(`/service-accounts/${id}`, 'DELETE'),

  knowledgeContent: (q: Q, s?: AbortSignal) =>
    apiGet<Paginated<KnowledgeContent>>('/knowledge/content', q, s),
  addKnowledgeContent: (knowledgeId: string, form: FormData) =>
    apiForm(`/knowledge/content?knowledge_id=${encodeURIComponent(knowledgeId)}`, form),
  refreshKnowledgeContent: (id: string) =>
    apiJson(`/knowledge/content/${id}/refresh`, 'POST'),
  deleteKnowledgeContent: (id: string) =>
    apiJson(`/knowledge/content/${id}`, 'DELETE'),
  knowledgeSearch: (body: {
    query: string
    knowledge_id?: string
    max_results?: number
  }) => apiJson<KnowledgeSearchResult>('/knowledge/search', 'POST', body),

  approvals: (q: Q, s?: AbortSignal) =>
    apiGet<Paginated<Approval>>('/approvals', q, s),
  approvalsCount: (s?: AbortSignal) =>
    apiGet<{ count: number }>('/approvals/count', undefined, s),
  resolveApproval: (id: string, approved: boolean) =>
    apiJson(`/approvals/${id}/resolve`, 'POST', { approved }),

  learnings: (q: Q, s?: AbortSignal) =>
    apiGet<Paginated<Learning>>('/learnings', q, s),
  deleteLearning: (id: string) => apiJson(`/learnings/${id}`, 'DELETE'),
  updateLearning: (
    id: string,
    body: { content?: Record<string, unknown>; metadata?: Record<string, unknown> }
  ) => apiJson(`/learnings/${id}`, 'PATCH', body),

  agent: (id: string, s?: AbortSignal) =>
    apiGet<ComponentDetail>(`/agents/${id}`, undefined, s),
  team: (id: string, s?: AbortSignal) =>
    apiGet<ComponentDetail>(`/teams/${id}`, undefined, s),

  agents: (s?: AbortSignal) => apiGet<ComponentRef[]>('/agents', undefined, s),
  teams: (s?: AbortSignal) => apiGet<ComponentRef[]>('/teams', undefined, s),
  workflows: (s?: AbortSignal) => apiGet<ComponentRef[]>('/workflows', undefined, s),

  registry: (q: Q, s?: AbortSignal) =>
    apiGet<Paginated<RegistryItem>>('/registry', q, s),

  components: (q: Q, s?: AbortSignal) =>
    apiGet<Paginated<Component>>('/components', q, s),
  createComponent: (body: {
    name: string
    component_type: ComponentType
    description?: string
    config?: Record<string, unknown>
    set_current?: boolean
  }) => apiJson<Component>('/components', 'POST', body),
  deleteComponent: (id: string) => apiJson(`/components/${id}`, 'DELETE'),
  restoreComponent: (id: string) => apiJson(`/components/${id}/restore`, 'POST'),
  componentConfigs: (id: string, s?: AbortSignal) =>
    apiGet<ComponentConfig[]>(`/components/${id}/configs`, undefined, s),
  componentCurrentConfig: (id: string, s?: AbortSignal) =>
    apiGet<ComponentConfig>(`/components/${id}/configs/current`, undefined, s),
  componentConfig: (id: string, version: number, s?: AbortSignal) =>
    apiGet<ComponentConfig>(`/components/${id}/configs/${version}`, undefined, s),
  deleteComponentConfig: (id: string, version: number) =>
    apiJson(`/components/${id}/configs/${version}`, 'DELETE'),
  saveComponentConfig: (id: string, config: Record<string, unknown>) =>
    apiJson(`/components/${id}/configs`, 'POST', { config, set_current: true }),
  setCurrentConfig: (id: string, version: number) =>
    apiJson(`/components/${id}/configs/${version}/set-current`, 'POST'),
  publishConfig: (id: string, version: number) =>
    apiJson(`/components/${id}/configs/${version}`, 'PATCH', { stage: 'published' }),

  migrateDatabase: (dbId: string) => apiJson(`/databases/${dbId}/migrate`, 'POST'),
  migrateAll: () => apiJson('/databases/all/migrate', 'POST'),

  interfaceStatus: (route: string, s?: AbortSignal) =>
    apiGet<{ status?: string }>(`${route}/status`, undefined, s)
}

export type { DailyMetric }
