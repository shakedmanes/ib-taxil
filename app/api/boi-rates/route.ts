import { NextRequest, NextResponse } from 'next/server'
import { dataflowFor } from '@/lib/boi/dataflow'

const EDGE = 'https://edge.boi.gov.il/FusionEdgeServer/sdmx/v2/data/dataflow'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const currency = (searchParams.get('currency') ?? 'USD').toUpperCase()
  const startperiod = searchParams.get('startperiod')
  const endperiod = searchParams.get('endperiod')

  if (!startperiod || !endperiod) {
    return NextResponse.json({ error: 'Missing startperiod or endperiod' }, { status: 400 })
  }

  let dataflow: string
  try {
    dataflow = dataflowFor(currency)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }

  // BOI SDMX expects camelCase startPeriod / endPeriod.
  const url = `${EDGE}/${dataflow}?startPeriod=${encodeURIComponent(startperiod)}&endPeriod=${encodeURIComponent(endperiod)}`
  const res = await fetch(url, { headers: { Accept: 'application/xml' } })
  if (!res.ok) {
    return NextResponse.json({ error: `BOI API error: ${res.status} ${res.statusText}` }, { status: res.status })
  }

  const xml = await res.text()

  // Extract each observation's TIME_PERIOD + OBS_VALUE. Match the element first,
  // then pull each attribute independently — XML attribute order is not guaranteed,
  // so we must not assume TIME_PERIOD comes before OBS_VALUE.
  const rates: { date: string; rate: string }[] = []
  for (const [element] of xml.matchAll(/<[^>]*(?:TIME_PERIOD|OBS_VALUE)="[^"]*"[^>]*>/g)) {
    const date = /TIME_PERIOD="(\d{4}-\d{2}-\d{2})"/.exec(element)?.[1]
    const rate = /OBS_VALUE="([^"]+)"/.exec(element)?.[1]
    if (date && rate) rates.push({ date, rate })
  }

  if (rates.length === 0) {
    return NextResponse.json({ error: 'No exchange rate data returned by BOI for the requested period' }, { status: 502 })
  }

  return NextResponse.json({ currency, rates })
}
