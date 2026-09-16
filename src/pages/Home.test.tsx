import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { OSProvider } from '@/lib/osContext'
import { Home } from './Home'
import type { OSConfig } from '@/lib/types'

const config: OSConfig = {
  os_id: 'os-1',
  manifest: {
    'agent-0': { description: 'An example agent.' },
    'team-1': { description: 'An example team.' }
  },
  agents: Array.from({ length: 8 }, (_, i) => ({
    id: `agent-${i}`,
    name: `Agent ${i}`,
    model: { id: 'example/model', provider: 'Example' }
  })),
  teams: [{ id: 'team-1', name: 'Team One', model: { id: 'example/model' } }],
  workflows: [{ id: 'workflow-1', name: 'Workflow One' }],
  interfaces: [{ type: 'whatsapp', route: '/whatsapp' }]
}

function mockFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const path = url.replace('/api', '')
      const body = path.startsWith('/config')
        ? config
        : { os_id: 'os-1', name: 'AgentOS' }
      return { ok: true, status: 200, json: async () => body } as Response
    })
  )
}

function renderHome() {
  return render(
    <MemoryRouter>
      <OSProvider>
        <Home />
      </OSProvider>
    </MemoryRouter>
  )
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Home', () => {
  it('renders the section headers and component names', async () => {
    mockFetch()
    renderHome()
    await waitFor(() => expect(screen.getByText('Agents')).toBeInTheDocument())
    expect(screen.getByText('Teams')).toBeInTheDocument()
    expect(screen.getByText('Workflows')).toBeInTheDocument()
    expect(screen.getByText('Interfaces')).toBeInTheDocument()
    expect(screen.getByText('Workflow One')).toBeInTheDocument()
    expect(screen.getByText('/whatsapp')).toBeInTheDocument()
  })

  it('collapses agents past the threshold behind Show more', async () => {
    mockFetch()
    renderHome()
    await waitFor(() => expect(screen.getByText('Agents')).toBeInTheDocument())
    // 8 agents, threshold 6 -> 2 hidden.
    expect(screen.getByText('Show more (+2)')).toBeInTheDocument()
    expect(screen.getByText('Agent 0')).toBeInTheDocument()
    expect(screen.queryByText('Agent 7')).not.toBeInTheDocument()
  })

  it('shows an error state when the runtime is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        statusText: 'err',
        text: async () => 'boom'
      }) as Response)
    )
    renderHome()
    await waitFor(() =>
      expect(screen.getByText('Retry')).toBeInTheDocument()
    )
  })
})
