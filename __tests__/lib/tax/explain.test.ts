import { describe, it, expect } from 'vitest'
import { explainCapitalGain, explainOverWithholding } from '@/lib/tax/explain'

describe('explanation builders', () => {
  it('builds a capital-gain explanation with provenance params', () => {
    const e = explainCapitalGain({
      ticker: 'AAPL', proceedsIls: '44400', costIls: '32000', gainIls: '12400',
      saleDate: '2024-03-10', saleRate: '3.70', openDate: '2019-05-01', openRate: '3.20',
    })
    expect(e.code).toBe('explain.capitalGain')
    expect(e.params.gainIls).toBe('12400')
    expect(e.params.openRate).toBe('3.20')
    expect(e.params.saleRate).toBe('3.70')
  })
  it('builds an over-withholding explanation', () => {
    const e = explainOverWithholding({ ticker: 'O', excessIls: '150', capRate: '25' })
    expect(e.code).toBe('explain.overWithholding')
    expect(e.params.excessIls).toBe('150')
  })
})
