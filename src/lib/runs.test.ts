import { describe, expect, it } from 'vitest'
import { runsToMessages } from './runs'

describe('runsToMessages', () => {
  it('flattens runs into user/assistant turns in time order', () => {
    const runs = [
      { run_input: 'second', content: 'reply 2', created_at: 200 },
      { run_input: 'first', content: 'reply 1', created_at: 100 }
    ]
    expect(runsToMessages(runs)).toEqual([
      { role: 'user', content: 'first', at: 100 },
      { role: 'assistant', content: 'reply 1', at: 100 },
      { role: 'user', content: 'second', at: 200 },
      { role: 'assistant', content: 'reply 2', at: 200 }
    ])
  })

  it('reads a {data:[...]} envelope and skips empty turns', () => {
    const data = { data: [{ run_input: 'hi', content: '' }] }
    expect(runsToMessages(data)).toEqual([
      { role: 'user', content: 'hi', at: undefined }
    ])
  })

  it('returns empty for unexpected shapes', () => {
    expect(runsToMessages(null)).toEqual([])
    expect(runsToMessages({})).toEqual([])
  })
})
