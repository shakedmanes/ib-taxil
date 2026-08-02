# IBKR Flex Query Parsing Implementation Plan (Plan B)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Parse an IBKR Flex Query (XML) into the engine's `IBKRData` — closed lots with open dates, dividends, interest, and quarantined out-of-scope records — and reject anything that isn't a closed-lots Flex Query.

**Architecture:** Pure parser modules under `lib/ibkr/`. One classifier decides in-scope vs out-of-scope per record; the parser never invents a number it can't source. Produces exactly the `IBKRData` shape Plan A consumes.

**Tech Stack:** TypeScript 5, `fast-xml-parser`, Vitest.

## Global Constraints

- Immutability; decimal strings for money (raw strings straight from IBKR, no arithmetic here).
- **Never fabricate open dates** (ADR-0002): a closed lot without an `openDateTime` is a parse defect surfaced via `hasClosedLotSection`, not a guess.
- Out-of-scope detection is mandatory (ADR-0008/CONTEXT): unknown asset categories and unrecognized taxable cash types become `OutOfScopeRecord`, never silently dropped or merged.
- **Every field name from IBKR is a verify item** — the first task validates the parser against a real Flex XML fixture the user provides; do not ship field names unconfirmed.

## File Structure

- `lib/ibkr/classify.ts` (create) — `classifyAsset(assetCategory)`, `classifyCashType(type)`.
- `lib/ibkr/parser-xml.ts` (replace) — `parseFlexXml(xml): IBKRData`.
- `lib/ibkr/detect.ts` (create) — `isFlexWithClosedLots(xml): boolean`, `looksLikeActivityStatement(input): boolean`.
- `lib/ibkr/parser-csv.ts` (replace) — thin module that **throws** `ActivityStatementRejected` (ADR-0003); CSV is no longer a data path.
- `__tests__/fixtures/flex-sample.xml` (create) — a real, anonymized Flex export (user-provided).
- Tests under `__tests__/lib/ibkr/`.

---

### Task 1: Provide and load a real Flex XML fixture

**Files:**
- Create: `__tests__/fixtures/flex-sample.xml`
- Test: `__tests__/lib/ibkr/fixture.test.ts`

**Interfaces:** Produces the fixture path used by every later test. **This task is a verification gate** — the fixture must be a genuine Flex export configured with Trades (Closed Lots) + Cash Transactions, anonymized (account id, names). If the user cannot supply one, STOP and request it; do not proceed on an invented fixture.

- [ ] **Step 1:** Ask the user for an anonymized Flex Query XML (Trades w/ Closed Lots + Cash Transactions). Save it to `__tests__/fixtures/flex-sample.xml`.
- [ ] **Step 2: Write a smoke test**

```ts
// __tests__/lib/ibkr/fixture.test.ts
import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
describe('flex fixture', () => {
  it('exists and contains FlexStatement + closed-lot detail', () => {
    const xml = readFileSync(new URL('../../fixtures/flex-sample.xml', import.meta.url), 'utf8')
    expect(xml).toContain('FlexStatement')
    expect(xml).toMatch(/levelOfDetail="CLOSED_LOT"|<ClosedLot/)
    expect(xml).toContain('CashTransaction')
  })
})
```

- [ ] **Step 3: Run** `npx vitest run __tests__/lib/ibkr/fixture.test.ts` — Expected: PASS once the real fixture is in place. If it fails on the closed-lot assertion, the export was built without Closed Lots — that itself is the case Plan A blocks on; capture a second fixture `flex-no-lots.xml` for the blocking test in Task 5.
- [ ] **Step 4: Commit**

```bash
git add __tests__/fixtures/flex-sample.xml __tests__/lib/ibkr/fixture.test.ts
git commit -m "test(ibkr): add anonymized Flex Query fixture"
```

---

### Task 2: Asset & cash-type classifier

**Files:**
- Create: `lib/ibkr/classify.ts`
- Test: `__tests__/lib/ibkr/classify.test.ts`

**Interfaces:**
- Produces:
  `classifyAsset(assetCategory: string): 'security' | 'out-of-scope'` — `STK` and `FUND`/`ETF` → security; `OPT`,`FOP`,`FUT`,`BOND`,`BILL`,`WAR`,`CFD`,`CASH` → out-of-scope.
  `classifyCashType(type: string): 'dividend' | 'withholding' | 'interest' | 'out-of-scope' | 'ignore'` — `Dividends`/`Payment In Lieu Of Dividends` → dividend; `Withholding Tax` → withholding; `Broker Interest Received` → interest; `Bond Interest` → out-of-scope; deposits/withdrawals/fees/`Broker Interest Paid` → ignore.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/ibkr/classify.test.ts
import { describe, it, expect } from 'vitest'
import { classifyAsset, classifyCashType } from '@/lib/ibkr/classify'

describe('classifyAsset', () => {
  it('treats stocks and funds as securities', () => {
    expect(classifyAsset('STK')).toBe('security')
    expect(classifyAsset('FUND')).toBe('security')
  })
  it('treats options/bonds/forex as out-of-scope', () => {
    for (const c of ['OPT', 'FUT', 'BOND', 'WAR', 'CFD', 'CASH']) {
      expect(classifyAsset(c)).toBe('out-of-scope')
    }
  })
})
describe('classifyCashType', () => {
  it('maps recognized taxable cash types', () => {
    expect(classifyCashType('Dividends')).toBe('dividend')
    expect(classifyCashType('Payment In Lieu Of Dividends')).toBe('dividend')
    expect(classifyCashType('Withholding Tax')).toBe('withholding')
    expect(classifyCashType('Broker Interest Received')).toBe('interest')
  })
  it('quarantines bond interest and ignores non-income cash', () => {
    expect(classifyCashType('Bond Interest')).toBe('out-of-scope')
    expect(classifyCashType('Deposits/Withdrawals')).toBe('ignore')
    expect(classifyCashType('Broker Interest Paid')).toBe('ignore')
  })
})
```

- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement**

```ts
// lib/ibkr/classify.ts
const SECURITY_ASSETS = new Set(['STK', 'FUND', 'ETF'])
const OUT_OF_SCOPE_ASSETS = new Set(['OPT', 'FOP', 'FUT', 'BOND', 'BILL', 'WAR', 'CFD', 'CASH', 'CMDTY'])

export function classifyAsset(assetCategory: string): 'security' | 'out-of-scope' {
  return SECURITY_ASSETS.has((assetCategory || '').toUpperCase()) ? 'security' : 'out-of-scope'
}

export function classifyCashType(type: string): 'dividend' | 'withholding' | 'interest' | 'out-of-scope' | 'ignore' {
  const t = (type || '').trim()
  if (t === 'Dividends' || t === 'Payment In Lieu Of Dividends') return 'dividend'
  if (t === 'Withholding Tax') return 'withholding'
  if (t === 'Broker Interest Received') return 'interest'
  if (t === 'Bond Interest') return 'out-of-scope'
  return 'ignore'
}
```

- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(ibkr): asset and cash-type classifier"`

---

### Task 3: Closed-lot detection

**Files:**
- Create: `lib/ibkr/detect.ts`
- Test: `__tests__/lib/ibkr/detect.test.ts`

**Interfaces:**
- Produces: `hasClosedLotDetail(parsed: unknown): boolean` — true iff at least one Trade element has `levelOfDetail === 'CLOSED_LOT'` (or a `ClosedLots` section exists). Used to set `IBKRData.hasClosedLotSection`.

- [ ] **Step 1: Write the failing test** (parse two inline XML snippets)

```ts
// __tests__/lib/ibkr/detect.test.ts
import { describe, it, expect } from 'vitest'
import { XMLParser } from 'fast-xml-parser'
import { hasClosedLotDetail } from '@/lib/ibkr/detect'

const parse = (xml: string) => new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' }).parse(xml)

describe('hasClosedLotDetail', () => {
  it('is true when a CLOSED_LOT trade exists', () => {
    const xml = `<FlexQueryResponse><FlexStatements><FlexStatement><Trades>
      <Trade levelOfDetail="EXECUTION" symbol="AAPL"/>
      <Trade levelOfDetail="CLOSED_LOT" symbol="AAPL" openDateTime="20190501"/>
    </Trades></FlexStatement></FlexStatements></FlexQueryResponse>`
    expect(hasClosedLotDetail(parse(xml))).toBe(true)
  })
  it('is false with only execution rows', () => {
    const xml = `<FlexQueryResponse><FlexStatements><FlexStatement><Trades>
      <Trade levelOfDetail="EXECUTION" symbol="AAPL"/>
    </Trades></FlexStatement></FlexStatements></FlexQueryResponse>`
    expect(hasClosedLotDetail(parse(xml))).toBe(false)
  })
})
```

- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement**

```ts
// lib/ibkr/detect.ts
function normaliseArray(v: unknown): Record<string, unknown>[] {
  if (!v) return []
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [v as Record<string, unknown>]
}

export function hasClosedLotDetail(parsed: unknown): boolean {
  const doc = parsed as Record<string, any>
  const stmt = doc?.FlexQueryResponse?.FlexStatements?.FlexStatement
  if (!stmt) return false
  const trades = normaliseArray(stmt.Trades?.Trade)
  return trades.some(t => String(t.levelOfDetail) === 'CLOSED_LOT') || Boolean(stmt.ClosedLots)
}
```

- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(ibkr): closed-lot detail detection"`

---

### Task 4: Flex XML parser → IBKRData

**Files:**
- Replace: `lib/ibkr/parser-xml.ts`
- Test: `__tests__/lib/ibkr/parser-xml.test.ts`

**Interfaces:**
- Consumes: classifier (Task 2), detector (Task 3).
- Produces: `parseFlexXml(xml: string): IBKRData` — closed lots from `levelOfDetail="CLOSED_LOT"` trades of security assets (with `openDateTime`→`openDate`, `tradeDate`→`saleDate`, `proceeds`,`cost`,`currency`,`symbol`); dividends by pairing `Dividends` with `Withholding Tax` on `(symbol, date)`; interest from `Broker Interest Received`; out-of-scope from non-security assets and quarantined cash types; `hasClosedLotSection` from Task 3; `lotMethod` best-effort from the first closed lot's context (default `'FIFO'`).

- [ ] **Step 1: Write the failing test** (inline XML covering all four buckets)

```ts
// __tests__/lib/ibkr/parser-xml.test.ts
import { describe, it, expect } from 'vitest'
import { parseFlexXml } from '@/lib/ibkr/parser-xml'

const xml = `<FlexQueryResponse><FlexStatements><FlexStatement accountId="U1" currency="USD" fromDate="20240101" toDate="20241231">
  <Trades>
    <Trade levelOfDetail="CLOSED_LOT" assetCategory="STK" symbol="AAPL" description="Apple" currency="USD"
           openDateTime="20190501;120000" tradeDate="20240310" proceeds="12000" cost="10000" quantity="-100" fifoPnlRealized="2000"/>
    <Trade levelOfDetail="CLOSED_LOT" assetCategory="OPT" symbol="AAPL240119C" description="AAPL call" currency="USD"
           openDateTime="20231001" tradeDate="20240310" proceeds="500" cost="200" quantity="-1"/>
  </Trades>
  <CashTransactions>
    <CashTransaction type="Dividends" symbol="KO" description="COCA-COLA" currency="USD" amount="100" settleDate="20240215" issuerCountryCode="US"/>
    <CashTransaction type="Withholding Tax" symbol="KO" description="COCA-COLA" currency="USD" amount="-25" settleDate="20240215"/>
    <CashTransaction type="Broker Interest Received" description="USD Interest" currency="USD" amount="40" settleDate="20240630"/>
    <CashTransaction type="Bond Interest" description="Some bond" currency="USD" amount="15" settleDate="20240401"/>
  </CashTransactions>
</FlexStatement></FlexStatements></FlexQueryResponse>`

describe('parseFlexXml', () => {
  const data = parseFlexXml(xml)
  it('extracts the security closed lot with open + sale dates', () => {
    expect(data.closedLots).toHaveLength(1)
    expect(data.closedLots[0]).toMatchObject({ ticker: 'AAPL', openDate: '2019-05-01', saleDate: '2024-03-10', proceeds: '12000', cost: '10000', currency: 'USD' })
    expect(data.hasClosedLotSection).toBe(true)
  })
  it('pairs dividend with withholding', () => {
    expect(data.dividends).toHaveLength(1)
    expect(data.dividends[0]).toMatchObject({ ticker: 'KO', gross: '100', withheldTax: '25', payDate: '2024-02-15', sourceCountry: 'US' })
  })
  it('extracts broker interest', () => {
    expect(data.interest).toHaveLength(1)
    expect(data.interest[0]).toMatchObject({ gross: '40', payDate: '2024-06-30' })
  })
  it('quarantines the option lot and bond interest', () => {
    const kinds = data.outOfScope.map(o => o.kind).sort()
    expect(kinds).toContain('option')
    expect(kinds).toContain('bond-interest')
  })
})
```

- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** (replace file; key logic below — dates via `parseDate`, amounts via `absStr`)

```ts
// lib/ibkr/parser-xml.ts
import { XMLParser } from 'fast-xml-parser'
import { classifyAsset, classifyCashType } from './classify'
import { hasClosedLotDetail } from './detect'
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
      proceeds: absStr(t.proceeds), cost: absStr(t.cost), method: String(t.originatingOrderID ? 'FIFO' : 'FIFO'),
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

  return {
    accountId: String(stmt.accountId ?? ''), baseCurrency, lotMethod: 'FIFO',
    hasClosedLotSection: hasClosedLotDetail(doc),
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
  if (s.length === 8 && !s.includes('-')) return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`
  return s.slice(0, 10)
}
function absStr(v: unknown): string { const s = String(v ?? '0'); return s.startsWith('-') ? s.slice(1) : s }
```

- [ ] **Step 4: Run** — Expected: PASS. Then run against the real fixture (add an assertion in `parser-xml.test.ts` that `parseFlexXml(fixtureXml)` yields non-empty `closedLots` and `hasClosedLotSection === true`). **This is the field-name verification gate** — if the real fixture uses different attribute names (e.g. `cost` vs `costBasis`, `tradeDate` vs `dateTime`), fix them here.
- [ ] **Step 5: Commit** `git commit -m "feat(ibkr): Flex XML parser to closed-lots IBKRData"`

---

### Task 5: Reject Activity Statement / missing-lots (ADR-0003)

**Files:**
- Replace: `lib/ibkr/parser-csv.ts`
- Create/extend: `lib/ibkr/detect.ts` (`looksLikeActivityStatement`)
- Test: `__tests__/lib/ibkr/reject.test.ts`

**Interfaces:**
- Produces: `class ActivityStatementRejected extends Error`; `parseCsv()` always throws it; `looksLikeActivityStatement(input: string): boolean` (true for the CSV Activity Statement header shape `Statement,Header,...`).

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/ibkr/reject.test.ts
import { describe, it, expect } from 'vitest'
import { parseCsv } from '@/lib/ibkr/parser-csv'
import { looksLikeActivityStatement } from '@/lib/ibkr/detect'

describe('activity statement rejection', () => {
  it('parseCsv throws ActivityStatementRejected', () => {
    expect(() => parseCsv('Statement,Header,Field Name,Field Value')).toThrow(/activity statement/i)
  })
  it('detects an activity statement CSV', () => {
    expect(looksLikeActivityStatement('Statement,Header,Field Name,Field Value\nTrades,Header,...')).toBe(true)
    expect(looksLikeActivityStatement('<FlexQueryResponse>')).toBe(false)
  })
})
```

- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement**

```ts
// lib/ibkr/parser-csv.ts  (replace entire file)
export class ActivityStatementRejected extends Error {
  constructor() {
    super('This looks like an IBKR Activity Statement, which lacks per-lot detail. Please upload a Flex Query configured with Trades (Closed Lots) + Cash Transactions.')
    this.name = 'ActivityStatementRejected'
  }
}
export function parseCsv(_csv: string): never { throw new ActivityStatementRejected() }
```

```ts
// lib/ibkr/detect.ts  (append)
export function looksLikeActivityStatement(input: string): boolean {
  return /^Statement,Header,/m.test(input) && !input.includes('FlexQueryResponse')
}
```

- [ ] **Step 4: Run** — Expected: PASS. Run full ibkr suite `npx vitest run __tests__/lib/ibkr` — Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(ibkr): reject Activity Statement; CSV path removed"`

## Self-Review
- Covers ADR-0002 (open dates from CLOSED_LOT), ADR-0003 (Flex-only, Activity Statement rejected), ADR-0008 (out-of-scope quarantined, `hasClosedLotSection` drives Plan A blocking), multi-currency (per-record `currency`).
- **Verify gates:** Task 1 (real fixture) and Task 4 step 4 (field names) — the ◐ checklist items for parsing. Source country falls back to `''` when `issuerCountryCode` absent (engine handles as `UNKNOWN`).
- No placeholders; all steps carry real code. `method` is a best-effort `'FIFO'` label pending the lot-method verification (checklist ◐).
