import { describe, it, expect } from 'vitest'
import type { EngineOutput } from '@/lib/tax/types'

describe('EngineOutput union', () => {
  it('discriminates computed vs blocked', () => {
    const blocked: EngineOutput = {
      status: 'blocked',
      issues: [{ code: 'missing-closed-lots', count: 3, explanation: { code: 'block.missingClosedLots', params: { count: '3' } } }],
    }
    expect(blocked.status).toBe('blocked')
    if (blocked.status === 'blocked') expect(blocked.issues[0].count).toBe(3)
  })
})
