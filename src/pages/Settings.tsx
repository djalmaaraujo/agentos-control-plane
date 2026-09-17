import { useState } from 'react'
import { Check, Copy, KeyRound, Loader2, LogOut, Plus, Trash2 } from 'lucide-react'
import { useOS } from '@/lib/osContext'
import { api } from '@/lib/api'
import { useApi } from '@/lib/useApi'
import { getAuthToken, setAuthToken } from '@/lib/client'
import { generateRsaKeypair } from '@/lib/keys'
import { getTheme, setTheme, type Theme } from '@/lib/theme'
import { PageHeader } from '@/components/data'
import { cn } from '@/lib/utils'

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="label">{label}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1200)
          }}
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-faint hover:text-fg"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          copy
        </button>
      </div>
      <pre className="max-h-40 overflow-auto rounded-lg border border-border bg-inset p-3 font-mono text-[11px] leading-relaxed text-muted">
        {value}
      </pre>
    </div>
  )
}

function AuthPanel() {
  const [keys, setKeys] = useState<{ publicKeyPem: string; privateKeyPem: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const snippet = keys
    ? `from agno.os import AgentOS
from agno.os.config import AuthorizationConfig

agent_os = AgentOS(
    agents=[...],
    authorization=True,
    authorization_config=AuthorizationConfig(
        verification_keys=["""${keys.publicKeyPem}"""],
        algorithm="RS256",
    ),
)`
    : ''

  return (
    <div className="space-y-3">
      <p className="text-[12px] leading-relaxed text-faint">
        Generate an RS256 keypair to enable JWT auth. Put the public key in your
        AgentOS <span className="font-mono">verification_keys</span> and set{' '}
        <span className="font-mono">authorization=True</span>; sign tokens with the
        private key. Both are generated in your browser and never sent anywhere.
      </p>
      <button
        onClick={async () => {
          setBusy(true)
          try {
            setKeys(await generateRsaKeypair())
          } finally {
            setBusy(false)
          }
        }}
        className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-[12px] text-muted hover:bg-hover hover:text-fg"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
        Generate RS256 keypair
      </button>
      {keys && (
        <div className="space-y-3">
          <CopyBlock label="Public key (verification_keys)" value={keys.publicKeyPem} />
          <CopyBlock label="Private key (sign tokens — keep secret)" value={keys.privateKeyPem} />
          <CopyBlock label="AgentOS config" value={snippet} />
        </div>
      )}
      <div className="border-t border-border-soft pt-3">
        <div className="label mb-2">Supported auth modes</div>
        <div className="space-y-1 text-[12px] text-faint">
          <div><span className="font-mono text-muted">security_key</span> — shared bearer (OS_SECURITY_KEY)</div>
          <div><span className="font-mono text-muted">jwt</span> — control-plane or self-hosted (RS256/ES256/HS256)</div>
          <div><span className="font-mono text-muted">jwks_file</span> — third-party IDP (WorkOS, Auth0, Okta)</div>
          <div><span className="font-mono text-muted">cookie</span> — JWTMiddleware token from a cookie</div>
        </div>
      </div>
    </div>
  )
}

function ThemePanel() {
  const [theme, setThemeState] = useState<Theme>(getTheme())
  const pick = (t: Theme) => {
    setTheme(t)
    setThemeState(t)
  }
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13px] text-faint">Theme</span>
      <div className="flex gap-1 rounded-md border border-border p-0.5">
        {(['dark', 'light'] as const).map((t) => (
          <button
            key={t}
            onClick={() => pick(t)}
            className={cn(
              'rounded px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors',
              theme === t ? 'bg-accent text-black' : 'text-faint hover:text-fg'
            )}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}

function InterfaceRow({ type, route }: { type: string; route: string }) {
  const { data } = useApi((s) => api.interfaceStatus(route, s), [route])
  const ok = data?.status === 'available'
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-soft py-2.5 last:border-0">
      <span className="flex items-center gap-2 text-[13px] text-faint">
        <span
          className={cn('h-1.5 w-1.5 rounded-full', ok ? 'bg-emerald-400' : 'bg-faint')}
        />
        {type}
      </span>
      <span className="font-mono text-[12px] text-muted">
        {route} {data?.status && <span className="text-faint">· {data.status}</span>}
      </span>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-soft py-2.5 last:border-0">
      <span className="text-[13px] text-faint">{label}</span>
      <span className="truncate font-mono text-[12px] text-muted">{value ?? '—'}</span>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="label mb-3">{title}</div>
      {children}
    </section>
  )
}

export function Settings() {
  const { info, config, servers, active, setActive, addServer, removeServer } =
    useOS()
  const [name, setName] = useState('')
  const [base, setBase] = useState('')
  const authed = !!getAuthToken()
  const interfaces = config?.interfaces ?? []
  const kbs = config?.knowledge?.knowledge_instances ?? []

  const logout = () => {
    setAuthToken('')
    location.reload()
  }

  return (
    <div>
      <PageHeader title="Settings" />
      <div className="mx-auto max-w-3xl space-y-4 px-8 py-6">
        <Panel title="AgentOS">
          <Row label="Name" value={info?.name} />
          <Row label="OS ID" value={info?.os_id} />
          <Row label="AgentOS version" value={info?.os_version} />
          <Row label="Agno version" value={info?.agno_version} />
          <Row label="Auth mode" value={info?.auth_mode} />
          <Row
            label="Components"
            value={`${info?.agent_count ?? 0} agents · ${info?.team_count ?? 0} teams · ${info?.workflow_count ?? 0} workflows`}
          />
          <Row label="Database" value={config?.os_database} />
          <Row
            label="MCP"
            value={
              info?.mcp?.enabled ? `enabled · ${info.mcp.path}` : 'disabled'
            }
          />
        </Panel>

        <Panel title="Appearance">
          <ThemePanel />
        </Panel>

        <Panel title="Access">
          <Row
            label="Control plane login"
            value={
              <span className={authed ? 'text-emerald-400' : 'text-faint'}>
                {authed ? 'signed in' : 'no password (open)'}
              </span>
            }
          />
          <Row
            label="API key"
            value="injected by the proxy · never sent to the browser"
          />
          <p className="mt-3 text-[11px] leading-relaxed text-faint">
            The login gate is enabled by setting <span className="font-mono">CP_AUTH_TOKEN</span>{' '}
            on the container. The browser sends it as <span className="font-mono">X-CP-Auth</span>;
            the proxy rejects <span className="font-mono">/api</span> without it.
          </p>
          {authed && (
            <button
              onClick={logout}
              className="mt-3 flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-[12px] text-muted hover:bg-hover hover:text-fg"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </button>
          )}
        </Panel>

        <Panel title="Authorization (JWT)">
          <AuthPanel />
        </Panel>

        <Panel title="Servers">
          <div className="space-y-1.5">
            {servers.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-md border border-border-soft px-3 py-2"
              >
                <button
                  onClick={() => setActive(s.id)}
                  className="flex items-center gap-2 text-left"
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      s.id === active.id ? 'bg-accent' : 'bg-faint'
                    )}
                  />
                  <span className="text-[13px] text-fg">{s.name}</span>
                  <span className="font-mono text-[11px] text-faint">{s.apiBase}</span>
                </button>
                {s.removable && (
                  <button
                    onClick={() => removeServer(s.id)}
                    className="rounded p-1 text-faint hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-40 rounded-md border border-border bg-panel px-3 py-1.5 text-[12px] text-fg outline-none focus:border-accent"
            />
            <input
              value={base}
              onChange={(e) => setBase(e.target.value)}
              placeholder="https://os.example.com or /api"
              className="flex-1 rounded-md border border-border bg-panel px-3 py-1.5 font-mono text-[12px] text-fg outline-none focus:border-accent"
            />
            <button
              onClick={() => {
                if (name && base) {
                  addServer(name.trim(), base.trim())
                  setName('')
                  setBase('')
                }
              }}
              className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-black hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </Panel>

        {interfaces.length > 0 && (
          <Panel title="Interfaces">
            {interfaces.map((i) => (
              <InterfaceRow key={i.route} type={i.type} route={i.route} />
            ))}
          </Panel>
        )}

        <Panel title="Databases & knowledge">
          {(config?.databases ?? []).map((db) => (
            <Row key={db} label="Database" value={db} />
          ))}
          {kbs.map((kb) => (
            <Row key={kb.id} label={`KB · ${kb.name}`} value={kb.table} />
          ))}
        </Panel>

        <Panel title="Available models">
          {(config?.available_models ?? []).length === 0 ? (
            <p className="text-[13px] text-faint">None reported.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {config?.available_models?.map((m) => (
                <span
                  key={m.id}
                  className="rounded border border-border bg-inset px-2 py-1 font-mono text-[11px] text-muted"
                >
                  {m.id}
                  <span className="text-faint"> · {m.provider}</span>
                </span>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
