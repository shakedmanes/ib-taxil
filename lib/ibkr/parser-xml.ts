import { XMLParser } from 'fast-xml-parser'
import type { IBKRData, Trade, Dividend } from './types'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseAttributeValue: false,
})

export function parseFlexXml(xml: string): IBKRData {
  const doc = parser.parse(xml)
  const stmt = doc?.FlexQueryResponse?.FlexStatements?.FlexStatement

  if (!stmt) throw new Error('Invalid Flex Query XML: missing FlexStatement')

  const accountId: string = stmt.accountId ?? ''
  const currency: string = stmt.currency ?? 'USD'
  const fromDate: string = stmt.fromDate ?? ''
  const toDate: string = stmt.toDate ?? ''

  const trades: Trade[] = parseTrades(stmt, currency)
  const dividends: Dividend[] = parseDividends(stmt, currency)

  return { accountId, currency, fromDate, toDate, trades, dividends, foreignIncome: [] }
}

function parseTrades(stmt: Record<string, unknown>, defaultCurrency: string): Trade[] {
  const rawTrades = normaliseArray((stmt.Trades as Record<string, unknown>)?.Trade)

  return rawTrades.map((t: Record<string, unknown>, i: number) => ({
    id: String(t.transactionID ?? `trade-${i}`),
    date: String(t.tradeDate ?? String(t.dateTime ?? '').split(';')[0] ?? '').slice(0, 10),
    ticker: String(t.symbol ?? ''),
    description: String(t.description ?? ''),
    tradeType: String(t.buySell ?? '').toLowerCase().startsWith('b') ? 'buy' : 'sell',
    quantity: Math.abs(Number(t.quantity)),
    priceUsd: String(t.tradePrice ?? '0'),
    proceedsUsd: absStr(t.proceeds),
    costUsd: absStr(t.cost),
    gainLossUsd: String(t.fifoPnlRealized ?? '0'),
    currency: String(t.currency ?? defaultCurrency),
  }))
}

function parseDividends(stmt: Record<string, unknown>, defaultCurrency: string): Dividend[] {
  const rawCash = normaliseArray(
    (stmt.CashTransactions as Record<string, unknown>)?.CashTransaction,
  )

  const divTxns = rawCash.filter(
    (c: Record<string, unknown>) => c.type === 'Dividends',
  )
  const taxTxns = rawCash.filter(
    (c: Record<string, unknown>) => c.type === 'Withholding Tax',
  )

  return divTxns.map((d: Record<string, unknown>, i: number) => {
    const settleDate = String(
      d.settleDate ?? String(d.dateTime ?? '').split(';')[0] ?? '',
    ).slice(0, 10)

    const withheld = taxTxns.find((t: Record<string, unknown>) => {
      const tDate = String(
        t.settleDate ?? String(t.dateTime ?? '').split(';')[0] ?? '',
      ).slice(0, 10)
      return t.symbol === d.symbol && tDate === settleDate
    })

    return {
      id: String(d.transactionID ?? `div-${i}`),
      date: settleDate,
      ticker: String(d.symbol ?? ''),
      description: String(d.description ?? ''),
      amountUsd: absStr(d.amount),
      withheldTaxUsd: withheld ? absStr(withheld.amount) : '0',
      currency: String(d.currency ?? defaultCurrency),
    }
  })
}

/** Strip leading minus sign from a numeric string, preserving decimal places. */
function absStr(v: unknown): string {
  const s = String(v ?? '0')
  return s.startsWith('-') ? s.slice(1) : s
}

function normaliseArray(v: unknown): Record<string, unknown>[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}
