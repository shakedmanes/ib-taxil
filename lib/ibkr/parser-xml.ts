import { XMLParser } from 'fast-xml-parser'
import { add } from '@/lib/tax/decimal'
import { classifyAsset, classifyCashType } from './classify'
import { hasClosedLotDetail, hasAnyTrade } from './detect'
import type { IBKRData, ClosedLot, DividendRecord, InterestRecord, OutOfScopeRecord } from './types'

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', parseAttributeValue: false })

export function parseFlexXml(xml: string): IBKRData {
  const doc = parser.parse(xml)
  const statements = arr(doc?.FlexQueryResponse?.FlexStatements?.FlexStatement)
  if (statements.length === 0) throw new Error('Invalid Flex Query XML: missing FlexStatement')

  const baseCurrency = String(statements[0].currency ?? 'USD')
  const accountId = String(statements[0].accountId ?? '')

  // Closed-lot detail appears either as <Lot> elements (Flex "Closed Lots"
  // option) or as <Trade levelOfDetail="CLOSED_LOT"> rows. Aggregate both
  // across every statement in the file.
  const lotRows = statements.flatMap(s =>
    arr(s.Trades?.Lot).filter(l => String(l.levelOfDetail ?? 'CLOSED_LOT') === 'CLOSED_LOT'))
  const tradeClosedRows = statements.flatMap(s =>
    arr(s.Trades?.Trade).filter(t => String(t.levelOfDetail) === 'CLOSED_LOT'))
  const closedLotRows = [...lotRows, ...tradeClosedRows]
  const cash = statements.flatMap(s => arr(s.CashTransactions?.CashTransaction))

  const closedLots: ClosedLot[] = []
  const outOfScope: OutOfScopeRecord[] = []

  for (const t of closedLotRows) {
    if (classifyAsset(String(t.assetCategory)) === 'out-of-scope') {
      outOfScope.push({ id: id(t.transactionID, 'oos', outOfScope.length), kind: kindFromAsset(String(t.assetCategory)), description: String(t.description ?? t.symbol ?? ''), raw: `${t.assetCategory} ${t.symbol}` })
      continue
    }
    const cost = absStr(t.cost)
    // <Lot> rows carry cost + realized P&L but leave proceeds empty; the sale
    // proceeds are cost + fifoPnlRealized. <Trade> CLOSED_LOT rows carry proceeds.
    const proceeds = hasValue(t.proceeds) ? absStr(t.proceeds) : add(cost, String(t.fifoPnlRealized ?? '0'))
    closedLots.push({
      id: id(t.transactionID, 'lot', closedLots.length),
      ticker: String(t.symbol ?? ''), description: String(t.description ?? ''),
      currency: String(t.currency ?? baseCurrency), quantity: Math.abs(Number(t.quantity ?? 0)),
      openDate: parseDate(t.openDateTime), saleDate: parseDate(t.tradeDate ?? t.dateTime),
      proceeds, cost, method: 'FIFO',
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
      // Foreign tax withheld on interest is a 'Withholding Tax' cash transaction,
      // paired by symbol|date exactly like dividends (interest usually has an
      // empty symbol, so it keys as '|date'). Don't drop it — it drives the FTC.
      interest.push({ id: id(c.transactionID, 'int', interest.length), description: String(c.description ?? ''), currency: String(c.currency ?? baseCurrency), payDate: date, gross: absStr(c.amount), withheldTax: withholding.get(`${c.symbol}|${date}`) ?? '0', sourceCountry: String(c.issuerCountryCode ?? '') })
    } else if (cls === 'out-of-scope') {
      outOfScope.push({ id: id(c.transactionID, 'oos', outOfScope.length), kind: 'bond-interest', description: String(c.description ?? ''), raw: String(c.type) })
    }
  }

  // Trustworthy for capital gains when closed-lot detail is present, or when
  // there are no trades at all (nothing to miss).
  const hasClosedLotSection = hasClosedLotDetail(doc) || !hasAnyTrade(doc)

  return {
    accountId, baseCurrency, lotMethod: 'FIFO',
    hasClosedLotSection,
    closedLots, dividends, interest, outOfScope,
  }
}

function hasValue(v: unknown): boolean {
  return v != null && String(v).trim() !== ''
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
