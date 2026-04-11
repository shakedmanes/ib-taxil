import Papa from 'papaparse'
import type { IBKRData, Trade, Dividend } from './types'

export function parseCsv(csv: string): IBKRData {
  const lines = csv.split('\n').map(l => l.trim()).filter(Boolean)

  let accountId = ''
  let fromDate = ''
  let toDate = ''
  const trades: Trade[] = []
  const dividends: Dividend[] = []
  const withholdingMap = new Map<string, string>() // `${ticker}|${date}` → amount

  let tradeHeaders: string[] = []
  let divHeaders: string[] = []
  let taxHeaders: string[] = []

  for (const line of lines) {
    const cols = parseLine(line)
    const section = cols[0]
    const kind = cols[1]

    if (section === 'Statement' && kind === 'Data') {
      if (cols[2] === 'Account') accountId = cols[3]
      if (cols[2] === 'Period') {
        const match = cols[3].match(/(\w+ \d+, \d{4}) - (\w+ \d+, \d{4})/)
        if (match) {
          fromDate = parseMonthDayYear(match[1])
          toDate   = parseMonthDayYear(match[2])
        }
      }
    }

    if (section === 'Trades' && kind === 'Header') tradeHeaders = cols.slice(2)
    if (section === 'Trades' && kind === 'Data' && tradeHeaders.length) {
      const row = Object.fromEntries(tradeHeaders.map((h, i) => [h, cols[i + 2]]))
      const qty = Number(row['Quantity'] ?? '0')
      const rawDate = (row['Date/Time'] ?? '').split(',')[0].trim()
      trades.push({
        id: `csv-trade-${trades.length}`,
        date: rawDate,
        ticker: row['Symbol'] ?? '',
        description: row['Symbol'] ?? '',
        tradeType: qty < 0 ? 'sell' : 'buy',
        quantity: Math.abs(qty),
        priceUsd: row['T. Price'] ?? '0',
        proceedsUsd: String(Math.abs(Number(row['Proceeds'] ?? '0'))),
        costUsd: String(Math.abs(Number(row['Basis'] ?? '0'))),
        gainLossUsd: row['Realized P/L'] ?? '0',
        currency: row['Currency'] ?? 'USD',
      })
    }

    if (section === 'Dividends' && kind === 'Header') divHeaders = cols.slice(2)
    if (section === 'Dividends' && kind === 'Data' && divHeaders.length) {
      const row = Object.fromEntries(divHeaders.map((h, i) => [h, cols[i + 2]]))
      const ticker = (row['Description'] ?? '').split(' ')[0]
      dividends.push({
        id: `csv-div-${dividends.length}`,
        date: row['Date'] ?? '',
        ticker,
        description: row['Description'] ?? '',
        amountUsd: formatDecimal(row['Amount'] ?? '0'),
        withheldTaxUsd: '0', // filled below
        currency: row['Currency'] ?? 'USD',
      })
    }

    if (section === 'Withholding Tax' && kind === 'Header') taxHeaders = cols.slice(2)
    if (section === 'Withholding Tax' && kind === 'Data' && taxHeaders.length) {
      const row = Object.fromEntries(taxHeaders.map((h, i) => [h, cols[i + 2]]))
      const ticker = (row['Description'] ?? '').split(' ')[0]
      withholdingMap.set(`${ticker}|${row['Date']}`, formatDecimal(row['Amount'] ?? '0'))
    }
  }

  // Pair withholding taxes into dividends
  const pairedDividends = dividends.map(div => {
    const key = `${div.ticker}|${div.date}`
    const withheldTaxUsd = withholdingMap.get(key) ?? div.withheldTaxUsd
    return { ...div, withheldTaxUsd }
  })

  return { accountId, currency: 'USD', fromDate, toDate, trades, dividends: pairedDividends, foreignIncome: [] }
}

function parseLine(line: string): string[] {
  const result = Papa.parse<string[]>(line, { header: false })
  return (result.data[0] as string[]) ?? []
}

/** Parse "Month D, YYYY" → "YYYY-MM-DD" without UTC conversion */
function parseMonthDayYear(value: string): string {
  const months: Record<string, string> = {
    January: '01', February: '02', March: '03', April: '04',
    May: '05', June: '06', July: '07', August: '08',
    September: '09', October: '10', November: '11', December: '12',
  }
  const match = value.trim().match(/^(\w+)\s+(\d+),\s+(\d{4})$/)
  if (!match) return ''
  const [, month, day, year] = match
  return `${year}-${months[month] ?? '01'}-${String(day).padStart(2, '0')}`
}

/** Preserve decimal string format (e.g. "75.00", not "75") taking absolute value */
function formatDecimal(raw: string): string {
  const n = Number(raw)
  const abs = Math.abs(n)
  // Preserve the number of decimal places from the original string
  const dotIndex = raw.indexOf('.')
  const decimals = dotIndex >= 0 ? raw.length - dotIndex - 1 : 0
  return abs.toFixed(decimals)
}
