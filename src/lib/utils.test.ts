import { describe, expect, it } from 'vitest'
import { cn, isContentEvent, modelLabel } from './utils'

describe('isContentEvent', () => {
  it('accepts agent and team content events', () => {
    expect(isContentEvent('RunContent')).toBe(true)
    expect(isContentEvent('TeamRunContent')).toBe(true)
  })
  it('rejects non-content events and non-strings', () => {
    expect(isContentEvent('RunStarted')).toBe(false)
    expect(isContentEvent('TeamModelRequestStarted')).toBe(false)
    expect(isContentEvent(undefined)).toBe(false)
  })
})

describe('modelLabel', () => {
  it('prefers the model id and uppercases it (config shape)', () => {
    expect(modelLabel({ id: 'openai/gpt-5.6-luna', provider: 'OpenRouter' })).toBe(
      'OPENAI/GPT-5.6-LUNA'
    )
  })

  it('reads the /agents shape where the id lives on .model', () => {
    expect(
      modelLabel({ name: 'OpenRouter', model: 'openai/gpt-5.6-terra', provider: 'OpenRouter' })
    ).toBe('OPENAI/GPT-5.6-TERRA')
  })

  it('falls back to provider when no id is present', () => {
    expect(modelLabel({ provider: 'Anthropic' })).toBe('ANTHROPIC')
  })

  it('returns empty string for a missing model', () => {
    expect(modelLabel(undefined)).toBe('')
  })
})

describe('cn', () => {
  it('merges conflicting tailwind classes, last wins', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})
