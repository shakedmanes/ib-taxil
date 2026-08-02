import { describe, it, expect } from 'vitest'
import { parseCsv } from '@/lib/ibkr/parser-csv'
import { looksLikeActivityStatement } from '@/lib/ibkr/detect'

describe('activity statement rejection', () => {
  it('parseCsv throws ActivityStatementRejected', () => {
    expect(() => parseCsv('Statement,Header,Field Name,Field Value')).toThrow(/activity statement/i)
  })
  it('detects an activity statement CSV', () => {
    expect(looksLikeActivityStatement('Statement,Header,Field Name,Field Value\nTrades,Header,...')).toBe(true)
    expect(looksLikeActivityStatement('<FlexQueryResponse>')).toBe(false)
  })
})
