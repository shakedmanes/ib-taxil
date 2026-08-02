import { describe, it, expect } from 'vitest'
import { classifyAsset, classifyCashType } from '@/lib/ibkr/classify'

describe('classifyAsset', () => {
  it('treats stocks and funds as securities', () => {
    expect(classifyAsset('STK')).toBe('security')
    expect(classifyAsset('FUND')).toBe('security')
  })
  it('treats options/bonds/forex as out-of-scope', () => {
    for (const c of ['OPT', 'FUT', 'BOND', 'WAR', 'CFD', 'CASH']) {
      expect(classifyAsset(c)).toBe('out-of-scope')
    }
  })
})
describe('classifyCashType', () => {
  it('maps recognized taxable cash types', () => {
    expect(classifyCashType('Dividends')).toBe('dividend')
    expect(classifyCashType('Payment In Lieu Of Dividends')).toBe('dividend')
    expect(classifyCashType('Withholding Tax')).toBe('withholding')
    expect(classifyCashType('Broker Interest Received')).toBe('interest')
  })
  it('quarantines bond interest and ignores non-income cash', () => {
    expect(classifyCashType('Bond Interest')).toBe('out-of-scope')
    expect(classifyCashType('Deposits/Withdrawals')).toBe('ignore')
    expect(classifyCashType('Broker Interest Paid')).toBe('ignore')
  })
})
