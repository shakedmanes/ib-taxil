import { describe, it, expect } from 'vitest'
import { computeSurtax } from '@/lib/tax/surtax'

describe('computeSurtax', () => {
  it('skips surtax when other income is not provided', () => {
    const r = computeSurtax({ taxYear: 2025, capitalIncomeIls: '100000' })
    expect(r.surtaxIls).toBe('0')
    expect(r.explanation).toBeNull()
  })
  it('applies no surtax below the threshold', () => {
    const r = computeSurtax({ taxYear: 2024, otherIncomeIls: '500000', capitalIncomeIls: '100000' })
    // total 600000 < 721560
    expect(r.surtaxIls).toBe('0')
  })
  it('applies 3% base above the 2024 threshold, no capital surtax', () => {
    const r = computeSurtax({ taxYear: 2024, otherIncomeIls: '700000', capitalIncomeIls: '100000' })
    // total 800000; over threshold 800000-721560 = 78440; base 3% = 2353.2
    expect(r.surtaxIls).toBe('2353.2')
  })
  it('adds the 2% capital surtax in 2025 on capital income above the threshold', () => {
    const r = computeSurtax({ taxYear: 2025, otherIncomeIls: '700000', capitalIncomeIls: '100000' })
    // total 800000; over = 78440; base 3% = 2353.2
    // capital above threshold = min(100000, 78440) = 78440; 2% = 1568.8
    // total surtax = 3922
    expect(r.surtaxIls).toBe('3922')
  })
})
