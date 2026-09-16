// The active AgentOS base. Same-origin '/api' by default (nginx/dev-server proxy
// injects the bearer). Switching servers points this at another proxied base.
// A custom server may also be a full URL when that AgentOS is directly reachable.
let activeBase = '/api'

export function setActiveBase(base: string) {
  activeBase = base
}
export function getActiveBase() {
  return activeBase
}

// Control-plane auth token. Sent as X-CP-Auth on every API call; nginx rejects
// /api with a 401 when it does not match CP_AUTH_TOKEN. Empty = auth disabled.
const AUTH_KEY = 'cp.authToken'

export function getAuthToken(): string {
  try {
    return localStorage.getItem(AUTH_KEY) ?? ''
  } catch {
    return ''
  }
}
export function setAuthToken(token: string) {
  try {
    if (token) localStorage.setItem(AUTH_KEY, token)
    else localStorage.removeItem(AUTH_KEY)
  } catch {
    // ignore storage failures
  }
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getAuthToken()
  return { ...(token ? { 'X-CP-Auth': token } : {}), ...extra }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function url(path: string) {
  return `${activeBase}${path}`
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    let detail = body
    try {
      detail = JSON.parse(body).detail ?? body
    } catch {
      // keep raw text
    }
    throw new ApiError(res.status, detail || res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function toQuery(params?: Record<string, unknown>): string {
  if (!params) return ''
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    q.set(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, unknown>,
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(url(path + toQuery(params)), {
    headers: authHeaders({ Accept: 'application/json' }),
    signal
  })
  return handle<T>(res)
}

export async function apiJson<T>(
  path: string,
  method: string,
  body?: unknown,
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(url(path), {
    method,
    headers: authHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }),
    body: body === undefined ? undefined : JSON.stringify(body),
    signal
  })
  return handle<T>(res)
}

export async function apiForm<T>(
  path: string,
  form: FormData,
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(url(path), {
    method: 'POST',
    headers: authHeaders(),
    body: form,
    signal
  })
  return handle<T>(res)
}

// POST a multipart run and yield Server-Sent-Event-style JSON chunks. AgentOS
// streams newline-delimited JSON objects when stream=true.
export async function* streamRun(
  path: string,
  form: FormData,
  signal?: AbortSignal
): AsyncGenerator<Record<string, unknown>> {
  const res = await fetch(url(path), {
    method: 'POST',
    headers: authHeaders(),
    body: form,
    signal
  })
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => '')
    throw new ApiError(res.status, body || res.statusText)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    // AgentOS emits one JSON object per SSE "data:" line or per newline.
    let idx: number
    while ((idx = buffer.indexOf('\n')) >= 0) {
      let line = buffer.slice(0, idx).trim()
      buffer = buffer.slice(idx + 1)
      if (!line) continue
      if (line.startsWith('data:')) line = line.slice(5).trim()
      if (!line || line === '[DONE]') continue
      try {
        yield JSON.parse(line)
      } catch {
        // partial/non-JSON keepalive; ignore
      }
    }
  }
  const rest = buffer.trim().replace(/^data:\s*/, '')
  if (rest && rest !== '[DONE]') {
    try {
      yield JSON.parse(rest)
    } catch {
      // ignore trailing noise
    }
  }
}
