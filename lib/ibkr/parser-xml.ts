import { XMLParser } from 'fast-xml-parser'
import { classifyAsset, classifyCashType } from './classify'
import { hasClosedLotDetail, hasAnyTrade } from './detect'
import type { IBKRData, ClosedLot, DividendRecord, InterestRecord, OutOfScopeRecord } from './types'

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', parseAttributeValue: false })

export function parseFlexXml(xml: string): IBKRData {
  const doc = parser.parse(xml)
  const stmt = doc?.FlexQueryResponse?.FlexStatements?.FlexStatement
  if (!stmt) throw new Error('Invalid Flex Query XML: missing FlexStatement')

  const baseCurrency = String(stmt.currency ?? 'USD')
  const trades = arr(stmt.Trades?.Trade)
  const cash = arr(stmt.CashTransactions?.CashTransaction)

  const closedLots: ClosedLot[] = []
  const outOfScope: OutOfScopeRecord[] = []

  for (const t of trades) {
    if (String(t.levelOfDetail) !== 'CLOSED_LOT') continue
    if (classifyAsset(String(t.assetCategory)) === 'out-of-scope') {
      outOfScope.push({ id: id(t.transactionID, 'oos', outOfScope.length), kind: kindFromAsset(String(t.assetCategory)), description: String(t.description ?? t.symbol ?? ''), raw: `${t.assetCategory} ${t.symbol}` })
      continue
    }
    closedLots.push({
      id: id(t.transactionID, 'lot', closedLots.length),
      ticker: String(t.symbol ?? ''), description: String(t.description ?? ''),
      currency: String(t.currency ?? baseCurrency), quantity: Math.abs(Number(t.quantity ?? 0)),
      openDate: parseDate(t.openDateTime), saleDate: parseDate(t.tradeDate ?? t.dateTime),
      proceeds: absStr(t.proceeds), cost: absStr(t.cost), method: 'FIFO',
    })
  }

  const withholding = new Map<string, string>()
  for (const c of cash) if (classifyCashType(String(c.type)) === 'withholding') {
    withholding.set(`${c.symbol}|${parseDate(c.settleDate ?? c.dateTime)}`, absStr(c.amount))
  }

  const dividends: DividendRecord[] = []
  const interest: InterestRecord[] = []
  for (const c of cash) {
    const cls = classifyCashType(String(c.type))
    const date = parseDate(c.settleDate ?? c.dateTime)
    if (cls === 'dividend') {
      dividends.push({ id: id(c.transactionID, 'div', dividends.length), ticker: String(c.symbol ?? ''), description: String(c.description ?? ''), currency: String(c.currency ?? baseCurrency), payDate: date, gross: absStr(c.amount), withheldTax: withholding.get(`${c.symbol}|${date}`) ?? '0', sourceCountry: String(c.issuerCountryCode ?? '') })
    } else if (cls === 'interest') {
      interest.push({ id: id(c.transactionID, 'int', interest.length), description: String(c.description ?? ''), currency: String(c.currency ?? baseCurrency), payDate: date, gross: absStr(c.amount), withheldTax: '0', sourceCountry: String(c.issuerCountryCode ?? '') })
    } else if (cls === 'out-of-scope') {
      outOfScope.push({ id: id(c.transactionID, 'oos', outOfScope.length), kind: 'bond-interest', description: String(c.description ?? ''), raw: String(c.type) })
    }
  }

  // Trustworthy for capital gains when closed-lot detail is present, or when
  // there are no trades at all (nothing to miss).
  const hasClosedLotSection = hasClosedLotDetail(doc) || !hasAnyTrade(doc)

  return {
    accountId: String(stmt.accountId ?? ''), baseCurrency, lotMethod: 'FIFO',
    hasClosedLotSection,
    closedLots, dividends, interest, outOfScope,
  }
}

function kindFromAsset(a: string): string {
  const u = a.toUpperCase()
  if (u === 'OPT' || u === 'FOP') return 'option'
  if (u === 'BOND' || u === 'BILL') return 'bond'
  if (u === 'CASH') return 'forex'
  return 'unsupported'
}
function arr(v: unknown): Record<string, any>[] { return !v ? [] : Array.isArray(v) ? v : [v as Record<string, any>] }
function id(raw: unknown, prefix: string, i: number): string { return String(raw ?? `${prefix}-${i}`) }
function parseDate(raw: unknown): string {
  const s = String(raw ?? '').split(';')[0].trim()
  if (s.length === 8 && !s.includes('-')) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  return s.slice(0, 10)
}
function absStr(v: unknown): string { const s = String(v ?? '0'); return s.startsWith('-') ? s.slice(1) : s }
