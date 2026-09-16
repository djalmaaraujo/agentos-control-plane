// Shapes returned by the AgentOS REST API. Only the fields the control plane
// reads are typed; the API sends more.

export interface ModelRef {
  id?: string
  model?: string
  provider?: string
  name?: string
}

export interface ComponentRef {
  id: string
  name: string
  db_id?: string
  mode?: string
  model?: ModelRef
  is_factory?: boolean
  is_component?: boolean
}

export interface Interface {
  type: string
  version?: string
  route: string
}

export interface ManifestEntry {
  description?: string
  quick_prompts?: string[]
}

export interface KnowledgeInstance {
  id: string
  name: string
  db_id?: string
  table?: string
}

export interface KnowledgeConfig {
  dbs?: { db_id: string; domain_config?: { display_name?: string } }[]
  knowledge_instances?: KnowledgeInstance[]
}

export interface OSConfig {
  os_id: string
  os_database?: string
  databases?: string[]
  available_models?: ModelRef[]
  manifest?: Record<string, ManifestEntry>
  agents?: ComponentRef[]
  teams?: ComponentRef[]
  workflows?: ComponentRef[]
  interfaces?: Interface[]
  knowledge?: KnowledgeConfig
}

export interface OSInfo {
  os_id: string
  name: string
  os_version?: string
  agno_version?: string
  agent_count?: number
  team_count?: number
  workflow_count?: number
  auth_mode?: string
  mcp?: { enabled?: boolean; path?: string; oauth?: unknown }
}

export interface PageMeta {
  page: number
  limit: number
  total_pages: number
  total_count: number
  search_time_ms?: number
}

export interface Paginated<T> {
  data: T[]
  meta: PageMeta
}

export interface Session {
  session_id: string
  session_name?: string | null
  session_state?: Record<string, unknown>
  created_at?: string | number
  updated_at?: string | number
  session_type?: string
  agent_id?: string
  team_id?: string
  workflow_id?: string
  user_id?: string
  metrics?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export interface Trace {
  trace_id: string
  name?: string
  status?: string
  duration?: string | number
  start_time?: string
  end_time?: string
  total_spans?: number
  error_count?: number
  input?: string
  run_id?: string
  session_id?: string
  agent_id?: string
  team_id?: string
  workflow_id?: string
  user_id?: string
  created_at?: string | number
}

export interface TraceSpan {
  id: string
  name: string
  type?: string
  duration?: string | number
  start_time?: string
  end_time?: string
  status?: string
  input?: unknown
  output?: unknown
  metadata?: Record<string, unknown>
  spans?: TraceSpan[]
}

export interface TraceDetail extends Trace {
  output?: string
  tree?: TraceSpan[]
}

export interface Memory {
  memory_id?: string
  memory?: string
  topics?: string[]
  user_id?: string
  agent_id?: string
  team_id?: string
  updated_at?: string | number
  created_at?: string | number
}

export interface TokenMetrics {
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
  reasoning_tokens?: number
  cache_read_tokens?: number
  cache_write_tokens?: number
}

export interface DailyMetric {
  id: string
  date: string
  agent_runs_count?: number
  team_runs_count?: number
  workflow_runs_count?: number
  agent_sessions_count?: number
  team_sessions_count?: number
  workflow_sessions_count?: number
  users_count?: number
  token_metrics?: TokenMetrics
  model_metrics?: { count: number; model_id: string; model_provider: string }[]
}

export interface MetricsResponse {
  metrics: DailyMetric[]
  updated_at?: string
}

export interface EvalRun {
  id: string
  name?: string
  eval_type?: string
  agent_id?: string | null
  team_id?: string | null
  workflow_id?: string | null
  model_id?: string
  model_provider?: string
  evaluated_component_name?: string | null
  user_id?: string | null
  eval_data?: { eval_status?: string; [k: string]: unknown }
  eval_input?: { expected_tool_calls?: string[]; [k: string]: unknown }
  created_at?: string | number
  updated_at?: string | number
}

export interface Schedule {
  id: string
  name?: string
  description?: string
  method?: string
  endpoint?: string
  payload?: Record<string, unknown>
  cron_expr?: string
  timezone?: string
  timeout_seconds?: number
  max_retries?: number
  enabled?: boolean
  next_run_at?: number
  target_type?: string | null
  target_id?: string | null
  disabled_reason?: string | null
  created_at?: number
  updated_at?: number
}

export interface ServiceAccount {
  id: string
  name?: string
  description?: string
  created_at?: string | number
  last_used_at?: string | number | null
  token_preview?: string
}

export interface Approval {
  id: string
  status?: string
  tool_name?: string
  agent_id?: string
  team_id?: string
  run_id?: string
  session_id?: string
  user_id?: string
  created_at?: string | number
  [k: string]: unknown
}

export interface Learning {
  learning_id: string
  learning_type?: string
  user_id?: string
  agent_id?: string | null
  team_id?: string | null
  content?: {
    memories?: { id: string; content: string; source?: string; added_by_agent?: string }[]
    [k: string]: unknown
  }
  created_at?: string | number
  updated_at?: string | number
}

export interface ComponentDetail {
  id: string
  name: string
  model?: ModelRef
  tools?: { tools?: { name: string; requires_confirmation?: boolean }[] }
  sessions?: { add_history_to_context?: boolean; num_history_runs?: number }
  reasoning?: { reasoning?: boolean }
  system_message?: { instructions?: string; add_datetime_to_context?: boolean }
  members?: { id: string; name: string }[]
  [k: string]: unknown
}

export interface RegistryItem {
  id: string
  name: string
  type?: string
  metadata?: { id?: string; class_path?: string }
}

export interface ScheduleRun {
  id: string
  schedule_id?: string
  attempt?: number
  triggered_at?: number
  completed_at?: number
  status?: string
  status_code?: number
  run_id?: string
  session_id?: string
  error?: string | null
  input?: { input_content?: string }
  output?: { content?: string }
  created_at?: number
}

export interface KnowledgeContent {
  id: string
  name?: string
  description?: string
  type?: string
  size?: number | string
  status?: string
  metadata?: Record<string, unknown>
  created_at?: string | number
  updated_at?: string | number
}
