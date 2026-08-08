import { describe, it, expect, vi } from 'vitest'
import type { NextRequest } from 'next/server'
import { GET } from '@/app/api/boi-rates/route'

function req(url: string) { return { nextUrl: new URL(url) } as unknown as NextRequest }

describe('boi-rates route', () => {
  it('proxies the EUR dataflow and returns rates', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      '<Obs TIME_PERIOD="2024-03-08" OBS_VALUE="3.95"/>', { status: 200 })))
    const res = await GET(req('http://x/api/boi-rates?currency=EUR&startperiod=2024-01-01&endperiod=2024-12-31'))
    const body = await res.json() as { currency: string; rates: { date: string; rate: string }[] }
    expect(body.currency).toBe('EUR')
    expect(body.rates[0]).toEqual({ date: '2024-03-08', rate: '3.95' })
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('RER_EUR_ILS')
    expect(calledUrl).toContain('startPeriod=2024-01-01')
    expect(calledUrl).toContain('endPeriod=2024-12-31')
  })
  it('parses observations regardless of attribute order (OBS_VALUE before TIME_PERIOD)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      '<Obs OBS_VALUE="3.72" dim="x" TIME_PERIOD="2024-05-02"/>' +
      '<Obs TIME_PERIOD="2024-05-03" OBS_VALUE="3.73"/>', { status: 200 })))
    const res = await GET(req('http://x/api/boi-rates?currency=USD&startperiod=2024-01-01&endperiod=2024-12-31'))
    const body = await res.json() as { rates: { date: string; rate: string }[] }
    expect(body.rates).toEqual([
      { date: '2024-05-02', rate: '3.72' },
      { date: '2024-05-03', rate: '3.73' },
    ])
  })
})
