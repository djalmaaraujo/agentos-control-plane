import { apiGet, apiJson } from './client'
import type {
  Approval,
  ComponentDetail,
  DailyMetric,
  EvalRun,
  KnowledgeContent,
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
  TraceDetail
} from './types'

export { ApiError } from './client'

type Q = Record<string, unknown>

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

  traces: (q: Q, s?: AbortSignal) => apiGet<Paginated<Trace>>('/traces', q, s),
  trace: (id: string, s?: AbortSignal) =>
    apiGet<TraceDetail>(`/traces/${id}`, undefined, s),

  memories: (q: Q, s?: AbortSignal) =>
    apiGet<Paginated<Memory>>('/memories', q, s),
  memoryTopics: (s?: AbortSignal) => apiGet<string[]>('/memory_topics', undefined, s),
  deleteMemory: (id: string) => apiJson(`/memories/${id}`, 'DELETE'),
  optimizeMemories: () => apiJson('/optimize-memories', 'POST'),

  metrics: (q: Q, s?: AbortSignal) => apiGet<MetricsResponse>('/metrics', q, s),
  refreshMetrics: () => apiJson('/metrics/refresh', 'POST'),

  evalRuns: (q: Q, s?: AbortSignal) =>
    apiGet<Paginated<EvalRun>>('/eval-runs', q, s),

  schedules: (q: Q, s?: AbortSignal) =>
    apiGet<Paginated<Schedule>>('/schedules', q, s),
  enableSchedule: (id: string) => apiJson(`/schedules/${id}/enable`, 'POST'),
  disableSchedule: (id: string) => apiJson(`/schedules/${id}/disable`, 'POST'),
  triggerSchedule: (id: string) => apiJson(`/schedules/${id}/trigger`, 'POST'),
  scheduleRuns: (id: string, q: Q, s?: AbortSignal) =>
    apiGet<Paginated<ScheduleRun>>(`/schedules/${id}/runs`, q, s),

  serviceAccounts: (q: Q, s?: AbortSignal) =>
    apiGet<Paginated<ServiceAccount>>('/service-accounts', q, s),

  knowledgeContent: (q: Q, s?: AbortSignal) =>
    apiGet<Paginated<KnowledgeContent>>('/knowledge/content', q, s),

  approvals: (q: Q, s?: AbortSignal) =>
    apiGet<Paginated<Approval>>('/approvals', q, s),
  approvalsCount: (s?: AbortSignal) =>
    apiGet<{ count: number }>('/approvals/count', undefined, s),
  resolveApproval: (id: string, approved: boolean) =>
    apiJson(`/approvals/${id}/resolve`, 'POST', { approved }),

  learnings: (q: Q, s?: AbortSignal) =>
    apiGet<Paginated<Learning>>('/learnings', q, s),
  deleteLearning: (id: string) => apiJson(`/learnings/${id}`, 'DELETE'),

  agent: (id: string, s?: AbortSignal) =>
    apiGet<ComponentDetail>(`/agents/${id}`, undefined, s),
  team: (id: string, s?: AbortSignal) =>
    apiGet<ComponentDetail>(`/teams/${id}`, undefined, s),

  registry: (q: Q, s?: AbortSignal) =>
    apiGet<Paginated<RegistryItem>>('/registry', q, s),

  migrateDatabase: (dbId: string) => apiJson(`/databases/${dbId}/migrate`, 'POST'),
  migrateAll: () => apiJson('/databases/all/migrate', 'POST'),

  interfaceStatus: (route: string, s?: AbortSignal) =>
    apiGet<{ status?: string }>(`${route}/status`, undefined, s)
}

export type { DailyMetric }
