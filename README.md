# AgentOS Control Plane

[![CI](https://github.com/djalmaaraujo/agentos-control-plane/actions/workflows/ci.yml/badge.svg)](https://github.com/djalmaaraujo/agentos-control-plane/actions/workflows/ci.yml)

A self-hosted control plane for [AgentOS](https://docs.agno.com/agent-os/overview).
It's a single-page React app that talks to the AgentOS REST API directly from the
browser — a lightweight, open alternative to the hosted dashboard.

Built with Vite + React + TypeScript + Tailwind. No backend of its own: a thin
proxy serves the app and forwards `/api` to your AgentOS runtime.

![Studio — visual canvas for teams and workflows](docs/studio.png)

## Features

- **Home** — agents, teams, workflows and interfaces as cards; open a chat or a
  config drawer (model, tools, instructions, history) for any component.
- **Chat** — stream a run (SSE) against an agent, team or workflow, with markdown
  replies, live tool calls (arguments + result), reasoning, workflow steps, and
  resume / rename / delete of past sessions.
- **Sessions** — every session with a tabbed detail (conversation, token metrics,
  metadata).
- **Traces** — spans as a tree or a time-axis timeline (agent / team / model /
  tool), with per-span input, output and metadata.
- **Studio** — build and version agents, teams and workflows at runtime with a
  guided form (model, instructions, tools, members, mode, history) or raw config
  JSON; teams and workflows get a visual canvas (React Flow) — members and steps
  as a graph you can edit — and config versions you can set current.
- **Learning** — user memories, profiles, entity memories, session context and
  decision logs.
- **Memory** — stored memories with search; create, edit, delete and optimize.
- **Knowledge** — documents per knowledge base; add content (text / URL / file),
  refresh and delete.
- **Metrics** — per-metric charts (tokens, users, runs, sessions, model mix), a
  month picker and a recalculate action.
- **Evaluations** — eval runs with the tool-call / judge breakdown.
- **Approvals** — tool calls waiting for a human; approve or reject.
- **Scheduler** — create cron schedules; run history; enable, disable, trigger.
- **Manage OS** — service accounts, the build registry, and database migrations.
- **Settings** — OS info, server switcher, access, interfaces, databases, models.

Plus a **multi-server switcher**, a **⌘K command palette**, and an optional
**login gate**.

## How it talks to AgentOS

The browser calls a same-origin `/api/*`. A thin proxy (the Vite dev server in
development, nginx in the container) forwards `/api` to the AgentOS runtime and
adds the `Authorization: Bearer <OS_SECURITY_KEY>` header, so the API key stays
in the proxy and never reaches the browser.

```
browser → /api/config → proxy (adds Bearer, checks login) → AgentOS → /config
```

### Login gate

Set `CP_AUTH_TOKEN` to require a password. The login screen stores it and sends
it as `X-CP-Auth` on every `/api` call; nginx returns 401 without it, so the API
is protected even though the SPA is public. Empty `CP_AUTH_TOKEN` disables it.

## Quick start

```bash
cp .env.example .env      # set OS_SECURITY_KEY (and optionally CP_AUTH_TOKEN)
npm install
npm run dev               # http://localhost:5173, proxies /api to AGENTOS_URL
```

Other scripts: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

## Run with Docker

The container serves the built SPA and proxies `/api` to your AgentOS runtime.

```bash
cp .env.example .env
docker compose up -d --build
```

It listens on host port **8810** (`8810 → 80`).

| Env | Default | What it is |
| --- | --- | --- |
| `AGENTOS_UPSTREAM` | `http://host.docker.internal:8000` | AgentOS runtime, from the container |
| `OS_SECURITY_KEY` | *(empty)* | Shared bearer for the REST API |
| `CP_AUTH_TOKEN` | *(empty)* | Login password (empty = no gate) |

### Behind a reverse proxy

Example Caddy block:

```
cp.example.com {
    reverse_proxy 127.0.0.1:8810
}
```

## Tech

React 18 · TypeScript · Vite · Tailwind CSS · React Router · Vitest. Charts and
markdown are rendered without heavy dependencies.

## License

MIT — see [LICENSE](LICENSE).
