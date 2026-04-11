import { buildRatesMap, getRateForDate } from '@/lib/boi/rates'
import type { ExchangeRate } from '@/lib/boi/types'

const MOCK_RATES: ExchangeRate[] = [
  { date: '2024-03-14', usdToIls: '3.70' },
  { date: '2024-03-15', usdToIls: '3.72' },
  { date: '2024-03-18', usdToIls: '3.75' }, // Monday after weekend
]

describe('buildRatesMap', () => {
  it('builds a map from date to rate', () => {
    const map = buildRatesMap(MOCK_RATES)
    expect(map.get('2024-03-15')).toBe('3.72')
  })

  it('includes all provided rates', () => {
    const map = buildRatesMap(MOCK_RATES)
    expect(map.size).toBe(3)
  })
})

describe('getRateForDate', () => {
  it('returns exact rate when available', () => {
    const map = buildRatesMap(MOCK_RATES)
    expect(getRateForDate(map, '2024-03-15')).toBe('3.72')
  })

  it('falls back to most recent prior rate for weekends (Saturday)', () => {
    const map = buildRatesMap(MOCK_RATES)
    // Saturday 2024-03-16 — should use Friday 2024-03-15
    expect(getRateForDate(map, '2024-03-16')).toBe('3.72')
  })

  it('falls back to most recent prior rate for Sundays', () => {
    const map = buildRatesMap(MOCK_RATES)
    // Sunday 2024-03-17 — should use Friday 2024-03-15
    expect(getRateForDate(map, '2024-03-17')).toBe('3.72')
  })

  it('throws if no prior rate exists within 7 days', () => {
    const map = buildRatesMap(MOCK_RATES)
    expect(() => getRateForDate(map, '2024-01-01')).toThrow()
  })
})
