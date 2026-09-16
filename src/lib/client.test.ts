import { afterEach, describe, expect, it, vi } from 'vitest'
import { streamRun, toQuery } from './client'

afterEach(() => vi.unstubAllGlobals())

describe('toQuery', () => {
  it('builds a query string and drops empty values', () => {
    expect(toQuery({ a: 1, b: '', c: undefined, d: 'x' })).toBe('?a=1&d=x')
  })
  it('returns empty string for no params', () => {
    expect(toQuery()).toBe('')
    expect(toQuery({})).toBe('')
  })
})

function sseStream(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(enc.encode(c))
      controller.close()
    }
  })
}

describe('streamRun', () => {
  it('parses SSE data lines and skips event/keepalive lines', async () => {
    // Mirrors the real AgentOS run stream: "event:" lines then "data:" JSON.
    const body = sseStream([
      'event: RunStarted\n',
      'data: {"event":"RunStarted","session_id":"s1"}\n\n',
      'event: RunContent\n',
      'data: {"event":"RunContent","content":"Hi"}\n\n',
      'data: {"event":"RunContent","content":" there"}\n\n',
      'data: [DONE]\n'
    ])
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, body }) as unknown as Response)
    )

    const events: Record<string, unknown>[] = []
    for await (const ev of streamRun('/agents/x/runs', new FormData())) {
      events.push(ev)
    }

    const text = events
      .filter((e) => e.event === 'RunContent')
      .map((e) => e.content)
      .join('')
    expect(text).toBe('Hi there')
    expect(events[0].session_id).toBe('s1')
  })

  it('throws ApiError on a failed response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500, body: null, text: async () => 'boom' }) as unknown as Response)
    )
    await expect(async () => {
      for await (const _ of streamRun('/agents/x/runs', new FormData())) void _
    }).rejects.toThrow()
  })
})
