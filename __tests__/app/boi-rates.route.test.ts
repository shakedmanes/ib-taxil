import { describe, it, expect, vi } from 'vitest'
import { GET } from '@/app/api/boi-rates/route'

function req(url: string) { return { nextUrl: new URL(url) } as any }

describe('boi-rates route', () => {
  it('proxies the EUR dataflow and returns rates', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      '<Obs TIME_PERIOD="2024-03-08" OBS_VALUE="3.95"/>', { status: 200 })))
    const res = await GET(req('http://x/api/boi-rates?currency=EUR&startperiod=2024-01-01&endperiod=2024-12-31'))
    const body = await res.json() as { currency: string; rates: { date: string; rate: string }[] }
    expect(body.currency).toBe('EUR')
    expect(body.rates[0]).toEqual({ date: '2024-03-08', rate: '3.95' })
    const calledUrl = (fetch as any).mock.calls[0][0] as string
    expect(calledUrl).toContain('RER_EUR_ILS')
    expect(calledUrl).toContain('startPeriod=2024-01-01')
    expect(calledUrl).toContain('endPeriod=2024-12-31')
  })
})
