// AgentOS RBAC scope catalog, mirrored from agno's AgentOSScope. Tokens are
// pure grants, so every scope here is emitted with effect 'allow'.

export interface ScopeGrant {
  scope: string
  effect: 'allow'
}

export const ADMIN_SCOPE = 'agent_os:admin'

// The token scopes AgentOS applies when none are requested.
export const DEFAULT_SCOPES = [
  'agents:run',
  'teams:run',
  'workflows:run',
  'sessions:read',
  'config:read'
]

// Resources that can be run, for both the wildcard and per-component grants.
export const RUN_RESOURCES = [
  { kind: 'agent', resource: 'agents', label: 'Agents' },
  { kind: 'team', resource: 'teams', label: 'Teams' },
  { kind: 'workflow', resource: 'workflows', label: 'Workflows' }
] as const

export interface GlobalScope {
  scope: string
  action: string
  privileged: boolean
}

export interface ScopeGroup {
  resource: string
  label: string
  scopes: GlobalScope[]
}

const g = (resource: string, action: string, privileged = false): GlobalScope => ({
  scope: `${resource}:${action}`,
  action,
  privileged
})

// Global resource:action scopes (data access, listing, administration).
export const GLOBAL_SCOPE_GROUPS: ScopeGroup[] = [
  { resource: 'config', label: 'Config', scopes: [g('config', 'read'), g('config', 'write', true)] },
  { resource: 'registry', label: 'Registry', scopes: [g('registry', 'read')] },
  { resource: 'agents', label: 'Agents (list)', scopes: [g('agents', 'read')] },
  { resource: 'teams', label: 'Teams (list)', scopes: [g('teams', 'read')] },
  { resource: 'workflows', label: 'Workflows (list)', scopes: [g('workflows', 'read')] },
  {
    resource: 'sessions',
    label: 'Sessions',
    scopes: [g('sessions', 'read'), g('sessions', 'write', true), g('sessions', 'delete', true)]
  },
  {
    resource: 'memories',
    label: 'Memories',
    scopes: [g('memories', 'read'), g('memories', 'write', true), g('memories', 'delete', true)]
  },
  {
    resource: 'learnings',
    label: 'Learnings',
    scopes: [g('learnings', 'read'), g('learnings', 'write', true), g('learnings', 'delete', true)]
  },
  {
    resource: 'knowledge',
    label: 'Knowledge',
    scopes: [g('knowledge', 'read'), g('knowledge', 'write', true), g('knowledge', 'delete', true)]
  },
  { resource: 'metrics', label: 'Metrics', scopes: [g('metrics', 'read'), g('metrics', 'write', true)] },
  {
    resource: 'evals',
    label: 'Evaluations',
    scopes: [g('evals', 'read'), g('evals', 'write', true), g('evals', 'delete', true)]
  },
  { resource: 'traces', label: 'Traces', scopes: [g('traces', 'read')] },
  {
    resource: 'service_accounts',
    label: 'Service accounts',
    scopes: [
      g('service_accounts', 'read', true),
      g('service_accounts', 'write', true),
      g('service_accounts', 'delete', true)
    ]
  }
]

// Mirror of agno's get_privileged_scopes: admin, any write/delete action, or any
// scope over the service_accounts resource make a token privileged.
export function isPrivilegedScope(scope: string): boolean {
  if (scope === ADMIN_SCOPE) return true
  const parts = scope.split(':')
  const resource = parts[0]
  const action = parts.length === 3 ? parts[2] : parts[1]
  if (resource === 'service_accounts') return true
  return action === 'write' || action === 'delete'
}
