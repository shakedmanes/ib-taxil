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

  const url = `${EDGE}/${dataflow}?startperiod=${encodeURIComponent(startperiod)}&endperiod=${encodeURIComponent(endperiod)}`
  const res = await fetch(url, { headers: { Accept: 'application/xml' } })
  if (!res.ok) {
    return NextResponse.json({ error: `BOI API error: ${res.status} ${res.statusText}` }, { status: res.status })
  }

  const xml = await res.text()

  // Extract all <Obs TIME_PERIOD="YYYY-MM-DD" OBS_VALUE="N.NNN" .../> entries
  const obsPattern = /TIME_PERIOD="(\d{4}-\d{2}-\d{2})"[^/]*OBS_VALUE="([^"]+)"/g
  const rates: { date: string; rate: string }[] = []
  let m: RegExpExecArray | null
  while ((m = obsPattern.exec(xml)) !== null) {
    rates.push({ date: m[1], rate: m[2] })
  }

  if (rates.length === 0) {
    return NextResponse.json({ error: 'No exchange rate data returned by BOI for the requested period' }, { status: 502 })
  }

  return NextResponse.json({ currency, rates })
}
