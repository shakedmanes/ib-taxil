import { describe, it, expect, vi } from 'vitest'
import { assembleRatesMap, fetchRatesMap } from '@/lib/boi/rates'

describe('assembleRatesMap', () => {
  it('keys by currency then date', () => {
    const map = assembleRatesMap({ USD: [{ date: '2024-03-08', rate: '3.65' }], EUR: [{ date: '2024-03-08', rate: '3.95' }] })
    expect(map.USD['2024-03-08']).toBe('3.65')
    expect(map.EUR['2024-03-08']).toBe('3.95')
  })
})
describe('fetchRatesMap', () => {
  it('fetches each currency and merges', async () => {
    vi.stubGlobal('fetch', vi.fn(async (u: string) => new Response(JSON.stringify({
      currency: u.includes('EUR') ? 'EUR' : 'USD',
      rates: [{ date: '2024-03-08', rate: u.includes('EUR') ? '3.95' : '3.65' }],
    }), { status: 200 })))
    const map = await fetchRatesMap(['USD', 'EUR'], '2024-01-01', '2024-12-31')
    expect(map.USD['2024-03-08']).toBe('3.65')
    expect(map.EUR['2024-03-08']).toBe('3.95')
  })
})
