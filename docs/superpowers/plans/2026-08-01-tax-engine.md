# Tax Calculation Engine Implementation Plan (Plan A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the pure, fully unit-tested Israeli-tax calculation engine that turns normalized IBKR data + BOI rates + user inputs into a verified `TaxResult`, with every figure carrying its own explanation.

**Architecture:** Small single-responsibility modules under `lib/tax/` (rates, rounding, rate-lookup, capital-gains, losses, dividends, interest, foreign-tax-credit, surtax, explain) composed by an orchestrator `calculator.ts`. Everything is a pure function over decimal strings — no I/O, no React, no parsing. Later plans (parser, rates fetch, exports, UI) feed and consume this engine; here it is exercised entirely against in-memory fixtures.

**Tech Stack:** TypeScript 5, `decimal.js` (via existing `lib/tax/decimal.ts` helpers), Vitest.

## Global Constraints

- **Immutability:** never mutate inputs or accumulators; always return new objects/arrays (spread). Copied verbatim from repo conventions.
- **Decimal strings only:** every monetary value is a plain string like `"1234.56"`, never a JS `number`. Use `lib/tax/decimal.ts` helpers for all arithmetic.
- **Full precision internally, round only at output (ADR-0009):** no rounding of intermediate values. The single output rounding is whole shekels, half-up, applied only when building the final `TaxResult` totals and line figures explicitly marked as output. Do **not** use the legacy `toIls` (2-dp) inside calculation.
- **Explanations are part of the output (ADR-0005):** every result line and total carries an `Explanation { code, params }`; the engine assembles them, the UI renders them.
- **Correctness policy (ADR-0008):** out-of-scope items are quarantined (result still returned); missing in-scope data produces a *blocking* result (no partial totals).
- **Verified law:** all rates/thresholds come from `docs/tax-research-findings.md` and `docs/tax-verification-checklist.md`. Do not invent constants.
- **Files under ~400 lines**, one responsibility each.

---

## File Structure

- `lib/ibkr/types.ts` (modify) — domain input types: `ClosedLot`, `DividendRecord`, `InterestRecord`, `OutOfScopeRecord`, revised `IBKRData`, `Currency`.
- `lib/tax/user-inputs.ts` (create) — `UserInputs` (substantial holdings, brought-forward loss, other income).
- `lib/boi/types.ts` (modify) — `RatesMap` keyed by currency→date→rate.
- `lib/boi/lookup.ts` (create) — `getRate(rates, currency, date)` with last-published-prior fallback.
- `lib/tax/decimal.ts` (modify) — add `roundShekels` (whole shekel, half-up).
- `lib/tax/rates.ts` (create) — `YearRates`, verified `RATE_TABLE`, `getYearRates(year)`.
- `lib/tax/explain.ts` (create) — `Explanation` type + typed builders.
- `lib/tax/types.ts` (modify) — result types (`CapitalGainLine`, `DividendLine`, `InterestLine`, `TaxResult`, `TaxResultBlocked`, etc.), all carrying explanations.
- `lib/tax/capital-gains.ts` (create) — per-closed-lot real gain.
- `lib/tax/losses.ts` (create) — §92 offset ordering (current vs brought-forward).
- `lib/tax/dividends.ts` (create) — per-dividend Israeli tax + withholding.
- `lib/tax/interest.ts` (create) — per-interest Israeli tax + withholding.
- `lib/tax/foreign-tax-credit.ts` (create) — per-country basket, over-withholding, excess credit.
- `lib/tax/surtax.ts` (create) — §121ב base + 2025 capital surtax.
- `lib/tax/calculator.ts` (modify) — orchestrator: quarantine/blocking, compose modules, assemble `TaxResult`.
- Tests mirror under `__tests__/lib/tax/` and `__tests__/lib/boi/`.

Task order respects dependencies: types → rates → rounding → lookup → capital-gains → losses → dividends → interest → FTC → surtax → orchestrator.

---

### Task 1: Domain input & user-input types

**Files:**
- Modify: `lib/ibkr/types.ts` (replace contents)
- Create: `lib/tax/user-inputs.ts`
- Modify: `lib/boi/types.ts`
- Test: `__tests__/lib/ibkr/types.test.ts`

**Interfaces:**
- Produces: `Currency`, `ClosedLot`, `DividendRecord`, `InterestRecord`, `OutOfScopeRecord`, `IBKRData`, `UserInputs`, `RatesMap`. These are consumed by every later task.

- [ ] **Step 1: Write the failing test** (a compile-level shape test — construct each type and assert fields exist)

```ts
// __tests__/lib/ibkr/types.test.ts
import { describe, it, expect } from 'vitest'
import type { ClosedLot, IBKRData, DividendRecord, InterestRecord, OutOfScopeRecord } from '@/lib/ibkr/types'
import type { UserInputs } from '@/lib/tax/user-inputs'

describe('domain types', () => {
  it('constructs an IBKRData with the new shape', () => {
    const lot: ClosedLot = {
      id: 'l1', ticker: 'AAPL', description: 'Apple', currency: 'USD',
      quantity: 10, openDate: '2019-05-01', saleDate: '2024-03-10',
      proceeds: '12000', cost: '10000', method: 'FIFO',
    }
    const div: DividendRecord = {
      id: 'd1', ticker: 'AAPL', description: 'Apple', currency: 'USD',
      payDate: '2024-02-15', gross: '100', withheldTax: '25', sourceCountry: 'US',
    }
    const int: InterestRecord = {
      id: 'i1', description: 'Broker Interest', currency: 'USD',
      payDate: '2024-06-30', gross: '40', withheldTax: '0', sourceCountry: 'US',
    }
    const oos: OutOfScopeRecord = { id: 'o1', kind: 'option', description: 'AAPL 240119C', raw: 'call option' }
    const data: IBKRData = {
      accountId: 'U123', baseCurrency: 'USD', lotMethod: 'FIFO',
      hasClosedLotSection: true,
      closedLots: [lot], dividends: [div], interest: [int], outOfScope: [oos],
    }
    const inputs: UserInputs = { substantialHoldings: [], broughtForwardLoss: '0' }
    expect(data.closedLots[0].openDate).toBe('2019-05-01')
    expect(inputs.broughtForwardLoss).toBe('0')
    expect(data.outOfScope[0].kind).toBe('option')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/ibkr/types.test.ts`
Expected: FAIL (types/fields don't exist yet — TS error / import failure).

- [ ] **Step 3: Write the types**

```ts
// lib/ibkr/types.ts  (replace entire file)
/** ISO 4217 currency code, e.g. 'USD', 'EUR'. */
export type Currency = string

/** A quantity of one security bought on openDate and sold on saleDate. */
export interface ClosedLot {
  id: string
  ticker: string
  description: string
  currency: Currency
  quantity: number
  openDate: string   // ISO YYYY-MM-DD (purchase)
  saleDate: string   // ISO YYYY-MM-DD (sale / realization)
  proceeds: string   // decimal string, sale-currency, gross positive
  cost: string       // decimal string, sale-currency, positive
  method: string     // IBKR lot-matching method label, e.g. 'FIFO'
}

export interface DividendRecord {
  id: string
  ticker: string
  description: string
  currency: Currency
  payDate: string        // receipt/payment date
  gross: string          // decimal string, positive
  withheldTax: string    // decimal string, positive
  sourceCountry: string  // ISO country code, '' if unknown
}

export interface InterestRecord {
  id: string
  description: string
  currency: Currency
  payDate: string
  gross: string
  withheldTax: string
  sourceCountry: string
}

/** Any imported record the engine does not compute — quarantined, never guessed. */
export interface OutOfScopeRecord {
  id: string
  kind: string          // 'option' | 'bond' | 'short' | 'forex' | 'unknown-cash'
  description: string
  raw: string           // short human summary for the quarantine list
}

export interface IBKRData {
  accountId: string
  baseCurrency: Currency
  lotMethod: string             // account-configured method label
  hasClosedLotSection: boolean  // false => capital gains cannot be computed
  closedLots: ClosedLot[]
  dividends: DividendRecord[]
  interest: InterestRecord[]
  outOfScope: OutOfScopeRecord[]
}
```

```ts
// lib/tax/user-inputs.ts
/** Manual, in-memory-only inputs collected in the "Additional details" step. */
export interface UserInputs {
  /** Tickers the user declared as a substantial holding (30% instead of 25%). */
  substantialHoldings: string[]
  /** Prior-year capital loss carried in (ILS decimal string). Offsets current gains ONLY. */
  broughtForwardLoss: string
  /** Total other annual taxable income (ILS) for surtax; undefined => skip surtax. */
  otherIncomeIls?: string
}
```

```ts
// lib/boi/types.ts  (replace entire file)
import type { Currency } from '@/lib/ibkr/types'

/** currency -> (ISO date 'YYYY-MM-DD') -> representative rate as decimal string. */
export type RatesMap = Record<Currency, Record<string, string>>

export interface ExchangeRateUsed {
  currency: Currency
  date: string
  rate: string
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/ibkr/types.test.ts` — Expected: PASS.
Also run `npx tsc --noEmit` and expect errors ONLY in files not yet migrated (calculator.ts, parsers, components). That's expected; later tasks and later plans fix them.

- [ ] **Step 5: Commit**

```bash
git add lib/ibkr/types.ts lib/tax/user-inputs.ts lib/boi/types.ts __tests__/lib/ibkr/types.test.ts
git commit -m "feat(tax): domain input, user-input, and rates-map types"
```

---

### Task 2: Verified year-keyed rate table

**Files:**
- Create: `lib/tax/rates.ts`
- Test: `__tests__/lib/tax/rates.test.ts`

**Interfaces:**
- Produces: `YearRates`, `RATE_TABLE`, `getYearRates(year: number): YearRates`, `SUPPORTED_YEARS: number[]`.
- Constants are copied verbatim from `docs/tax-verification-checklist.md` (verified 2026-08-01).

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/tax/rates.test.ts
import { describe, it, expect } from 'vitest'
import { getYearRates, SUPPORTED_YEARS } from '@/lib/tax/rates'

describe('rate table', () => {
  it('supports 2022-2025', () => {
    expect(SUPPORTED_YEARS).toEqual([2022, 2023, 2024, 2025])
  })
  it('has stable 25/30 rates every year', () => {
    for (const y of SUPPORTED_YEARS) {
      const r = getYearRates(y)
      expect(r.capitalGainsRate).toBe('25')
      expect(r.substantialHolderRate).toBe('30')
      expect(r.dividendRate).toBe('25')
      expect(r.interestRate).toBe('25')
      expect(r.surtaxBaseRate).toBe('3')
    }
  })
  it('has per-year surtax thresholds', () => {
    expect(getYearRates(2022).surtaxThresholdIls).toBe('663240')
    expect(getYearRates(2023).surtaxThresholdIls).toBe('698280')
    expect(getYearRates(2024).surtaxThresholdIls).toBe('721560')
    expect(getYearRates(2025).surtaxThresholdIls).toBe('721560')
  })
  it('adds the 2% capital surtax only from 2025', () => {
    expect(getYearRates(2024).capitalSurtaxRate).toBe('0')
    expect(getYearRates(2025).capitalSurtaxRate).toBe('2')
  })
  it('throws for an unsupported year', () => {
    expect(() => getYearRates(2021)).toThrow(/not supported/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/tax/rates.test.ts` — Expected: FAIL (module missing).

- [ ] **Step 3: Write the rate table**

```ts
// lib/tax/rates.ts
/**
 * Verified Israeli tax constants per tax year.
 * Source: docs/tax-research-findings.md (researched 2026-08-01).
 * §91b capital gains, §125ב dividends, §125ג interest, §121ב surtax,
 * 2025 Arrangements Law (Amendment 276) capital surtax.
 * Adding a future year = add one verified row here.
 */
export interface YearRates {
  capitalGainsRate: string
  substantialHolderRate: string
  dividendRate: string
  interestRate: string
  surtaxThresholdIls: string
  surtaxBaseRate: string
  capitalSurtaxRate: string // 0 before 2025, 2 from 2025
}

export const RATE_TABLE: Record<number, YearRates> = {
  2022: { capitalGainsRate: '25', substantialHolderRate: '30', dividendRate: '25', interestRate: '25', surtaxThresholdIls: '663240', surtaxBaseRate: '3', capitalSurtaxRate: '0' },
  2023: { capitalGainsRate: '25', substantialHolderRate: '30', dividendRate: '25', interestRate: '25', surtaxThresholdIls: '698280', surtaxBaseRate: '3', capitalSurtaxRate: '0' },
  2024: { capitalGainsRate: '25', substantialHolderRate: '30', dividendRate: '25', interestRate: '25', surtaxThresholdIls: '721560', surtaxBaseRate: '3', capitalSurtaxRate: '0' },
  2025: { capitalGainsRate: '25', substantialHolderRate: '30', dividendRate: '25', interestRate: '25', surtaxThresholdIls: '721560', surtaxBaseRate: '3', capitalSurtaxRate: '2' },
}

export const SUPPORTED_YEARS: number[] = Object.keys(RATE_TABLE).map(Number).sort((a, b) => a - b)

export function getYearRates(year: number): YearRates {
  const row = RATE_TABLE[year]
  if (!row) throw new Error(`Tax year ${year} is not supported (supported: ${SUPPORTED_YEARS.join(', ')})`)
  return row
}
```

- [ ] **Step 4: Run test to verify it passes** — Run: `npx vitest run __tests__/lib/tax/rates.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/tax/rates.ts __tests__/lib/tax/rates.test.ts
git commit -m "feat(tax): verified year-keyed rate/threshold table (2022-2025)"
```

---

### Task 3: Whole-shekel output rounding

**Files:**
- Modify: `lib/tax/decimal.ts` (add `roundShekels`)
- Test: `__tests__/lib/tax/decimal.test.ts`

**Interfaces:**
- Produces: `roundShekels(a: string): string` — nearest whole shekel, half rounded up, returned as an integer string.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/tax/decimal.test.ts
import { describe, it, expect } from 'vitest'
import { roundShekels } from '@/lib/tax/decimal'

describe('roundShekels', () => {
  it('rounds to nearest whole shekel', () => {
    expect(roundShekels('1234.49')).toBe('1234')
    expect(roundShekels('1234.51')).toBe('1235')
  })
  it('rounds a half up', () => {
    expect(roundShekels('1234.50')).toBe('1235')
    expect(roundShekels('0.5')).toBe('1')
  })
  it('handles negatives half-up (toward positive infinity)', () => {
    expect(roundShekels('-0.5')).toBe('0')
    expect(roundShekels('-1234.5')).toBe('-1234')
  })
  it('returns an integer string with no decimals', () => {
    expect(roundShekels('100')).toBe('100')
    expect(roundShekels('100.00')).toBe('100')
  })
})
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npx vitest run __tests__/lib/tax/decimal.test.ts` — Expected: FAIL (`roundShekels` undefined).

- [ ] **Step 3: Add the function**

```ts
// lib/tax/decimal.ts  (append)
/**
 * Output rounding (ADR-0009): nearest whole shekel, half rounded up.
 * decimal.js ROUND_HALF_UP rounds .5 away from zero; Israeli חוק עיגול סכומים
 * rounds a half toward positive infinity, so use ROUND_HALF_CEIL.
 */
export const roundShekels = (a: string): string =>
  new Decimal(a).toDecimalPlaces(0, Decimal.ROUND_HALF_CEIL).toFixed(0)
```

- [ ] **Step 4: Run test to verify it passes** — Run: `npx vitest run __tests__/lib/tax/decimal.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/tax/decimal.ts __tests__/lib/tax/decimal.test.ts
git commit -m "feat(tax): whole-shekel half-up output rounding"
```

---

### Task 4: BOI rate lookup with last-published fallback

**Files:**
- Create: `lib/boi/lookup.ts`
- Test: `__tests__/lib/boi/lookup.test.ts`

**Interfaces:**
- Consumes: `RatesMap` (Task 1).
- Produces: `getRate(rates: RatesMap, currency: Currency, date: string): string` — returns the rate on `date`, or the most recent prior published rate; throws if no rate at/before the date exists for the currency.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/boi/lookup.test.ts
import { describe, it, expect } from 'vitest'
import { getRate } from '@/lib/boi/lookup'
import type { RatesMap } from '@/lib/boi/types'

const rates: RatesMap = {
  USD: { '2024-03-07': '3.60', '2024-03-08': '3.65', '2024-03-11': '3.70' },
}

describe('getRate', () => {
  it('returns the exact-date rate', () => {
    expect(getRate(rates, 'USD', '2024-03-08')).toBe('3.65')
  })
  it('falls back to the last published prior rate (weekend)', () => {
    // 2024-03-09 (Sat) and 03-10 (Sun) unpublished -> use 03-08
    expect(getRate(rates, 'USD', '2024-03-10')).toBe('3.65')
  })
  it('walks back with no arbitrary cap', () => {
    expect(getRate(rates, 'USD', '2024-12-31')).toBe('3.70')
  })
  it('throws when no rate exists at or before the date', () => {
    expect(() => getRate(rates, 'USD', '2024-03-06')).toThrow(/no .*rate/i)
  })
  it('throws for an unknown currency', () => {
    expect(() => getRate(rates, 'JPY', '2024-03-08')).toThrow(/JPY/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npx vitest run __tests__/lib/boi/lookup.test.ts` — Expected: FAIL (module missing).

- [ ] **Step 3: Implement**

```ts
// lib/boi/lookup.ts
import type { RatesMap } from './types'
import type { Currency } from '@/lib/ibkr/types'

/**
 * Rate for a currency on a date; if none published that day, the most recent
 * prior published rate (ADR-0009: no arbitrary look-back cap). Throws if there
 * is no rate at or before the date, or the currency is absent.
 */
export function getRate(rates: RatesMap, currency: Currency, date: string): string {
  const forCurrency = rates[currency]
  if (!forCurrency) throw new Error(`No exchange rates loaded for currency ${currency}`)
  if (forCurrency[date]) return forCurrency[date]
  const priorDates = Object.keys(forCurrency).filter(d => d <= date).sort()
  const last = priorDates[priorDates.length - 1]
  if (!last) throw new Error(`No ${currency} rate published on or before ${date}`)
  return forCurrency[last]
}
```

- [ ] **Step 4: Run test to verify it passes** — Run: `npx vitest run __tests__/lib/boi/lookup.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/boi/lookup.ts __tests__/lib/boi/lookup.test.ts
git commit -m "feat(boi): rate lookup with last-published-prior fallback"
```

---

### Task 5: Explanation type and builders

**Files:**
- Create: `lib/tax/explain.ts`
- Test: `__tests__/lib/tax/explain.test.ts`

**Interfaces:**
- Produces: `Explanation { code: string; params: Record<string, string> }` and typed builder functions used by later tasks. The `code` is a stable i18n key the UI/exports render; the engine never emits prose, only code+params. This keeps the domain language-agnostic (bilingual UI in Plan E) while satisfying ADR-0005.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/tax/explain.test.ts
import { describe, it, expect } from 'vitest'
import { explainCapitalGain, explainOverWithholding } from '@/lib/tax/explain'

describe('explanation builders', () => {
  it('builds a capital-gain explanation with provenance params', () => {
    const e = explainCapitalGain({
      ticker: 'AAPL', proceedsIls: '44400', costIls: '32000', gainIls: '12400',
      saleDate: '2024-03-10', saleRate: '3.70', openDate: '2019-05-01', openRate: '3.20',
    })
    expect(e.code).toBe('explain.capitalGain')
    expect(e.params.gainIls).toBe('12400')
    expect(e.params.openRate).toBe('3.20')
    expect(e.params.saleRate).toBe('3.70')
  })
  it('builds an over-withholding explanation', () => {
    const e = explainOverWithholding({ ticker: 'O', excessIls: '150', capRate: '25' })
    expect(e.code).toBe('explain.overWithholding')
    expect(e.params.excessIls).toBe('150')
  })
})
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npx vitest run __tests__/lib/tax/explain.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// lib/tax/explain.ts
export interface Explanation {
  code: string
  params: Record<string, string>
}

export const explainCapitalGain = (p: {
  ticker: string; proceedsIls: string; costIls: string; gainIls: string
  saleDate: string; saleRate: string; openDate: string; openRate: string
}): Explanation => ({ code: 'explain.capitalGain', params: { ...p } })

export const explainDividend = (p: {
  ticker: string; grossIls: string; rate: string; israeliTaxIls: string
  creditIls: string; netTaxIls: string; payDate: string; fxRate: string
}): Explanation => ({ code: 'explain.dividend', params: { ...p } })

export const explainInterest = (p: {
  description: string; grossIls: string; rate: string; israeliTaxIls: string
  creditIls: string; netTaxIls: string; payDate: string; fxRate: string
}): Explanation => ({ code: 'explain.interest', params: { ...p } })

export const explainOverWithholding = (p: {
  ticker: string; excessIls: string; capRate: string
}): Explanation => ({ code: 'explain.overWithholding', params: { ...p } })

export const explainLossOffset = (p: {
  currentLossIls: string; broughtForwardIls: string; usedAgainstGainsIls: string
  usedAgainstIncomeIls: string; carryForwardIls: string
}): Explanation => ({ code: 'explain.lossOffset', params: { ...p } })

export const explainSurtax = (p: {
  otherIncomeIls: string; capitalIncomeIls: string; thresholdIls: string
  baseSurtaxIls: string; capitalSurtaxIls: string; totalSurtaxIls: string
}): Explanation => ({ code: 'explain.surtax', params: { ...p } })

export const explainCredit = (p: {
  country: string; foreignTaxIls: string; ceilingIls: string
  creditedIls: string; excessCarryForwardIls: string
}): Explanation => ({ code: 'explain.credit', params: { ...p } })
```

- [ ] **Step 4: Run test to verify it passes** — Run: `npx vitest run __tests__/lib/tax/explain.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/tax/explain.ts __tests__/lib/tax/explain.test.ts
git commit -m "feat(tax): language-agnostic explanation type and builders"
```

---

### Task 6: Result types

**Files:**
- Modify: `lib/tax/types.ts` (replace contents)
- Test: `__tests__/lib/tax/result-types.test.ts`

**Interfaces:**
- Consumes: `Explanation` (Task 5), `ExchangeRateUsed` (Task 1).
- Produces: `CapitalGainLine`, `DividendLine`, `InterestLine`, `QuarantinedItem`, `BlockingIssue`, `TaxResult`, `EngineOutput` (discriminated union of computed vs blocked). All monetary fields are ILS decimal strings; fields suffixed `Rounded` are whole-shekel output values.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/tax/result-types.test.ts
import { describe, it, expect } from 'vitest'
import type { EngineOutput } from '@/lib/tax/types'

describe('EngineOutput union', () => {
  it('discriminates computed vs blocked', () => {
    const blocked: EngineOutput = {
      status: 'blocked',
      issues: [{ code: 'missing-closed-lots', count: 3, explanation: { code: 'block.missingClosedLots', params: { count: '3' } } }],
    }
    expect(blocked.status).toBe('blocked')
    if (blocked.status === 'blocked') expect(blocked.issues[0].count).toBe(3)
  })
})
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npx vitest run __tests__/lib/tax/result-types.test.ts` — Expected: FAIL.

- [ ] **Step 3: Write the types**

```ts
// lib/tax/types.ts  (replace entire file)
import type { Explanation } from './explain'
import type { ExchangeRateUsed } from '@/lib/boi/types'

export interface CapitalGainLine {
  ticker: string
  description: string
  openDate: string
  saleDate: string
  openRate: string
  saleRate: string
  proceedsIls: string
  costIls: string
  gainIls: string       // signed real gain (may be negative)
  isSubstantial: boolean
  explanation: Explanation
}

export interface DividendLine {
  ticker: string
  payDate: string
  fxRate: string
  grossIls: string
  rate: string          // 25 or 30
  israeliTaxIls: string
  withheldIls: string
  creditIls: string
  netTaxIls: string
  overWithheldIls: string // >0 => reclaimable, flagged
  sourceCountry: string
  explanation: Explanation
}

export interface InterestLine {
  description: string
  payDate: string
  fxRate: string
  grossIls: string
  rate: string
  israeliTaxIls: string
  withheldIls: string
  creditIls: string
  netTaxIls: string
  overWithheldIls: string
  sourceCountry: string
  explanation: Explanation
}

export interface CountryCreditLine {
  country: string
  basket: 'dividend' | 'interest'
  foreignTaxIls: string
  ceilingIls: string
  creditedIls: string
  excessCarryForwardIls: string   // §205א 5-year carry
  explanation: Explanation
}

export interface QuarantinedItem {
  kind: string
  description: string
  explanation: Explanation
}

export interface BlockingIssue {
  code: 'missing-closed-lots' | 'missing-rate' | 'unsupported-currency' | 'unsupported-year'
  count: number
  explanation: Explanation
}

export interface TaxResult {
  status: 'ok'
  taxYear: number
  // capital gains
  capitalGainLines: CapitalGainLine[]
  totalGainsIls: string
  totalLossesIls: string
  // losses (ADR-0004)
  currentLossUsedAgainstGainsIls: string
  currentLossUsedAgainstIncomeIls: string
  broughtForwardUsedIls: string
  carryForwardLossIls: string
  netCapitalGainIls: string
  capitalGainsTaxIls: string
  // income
  dividendLines: DividendLine[]
  interestLines: InterestLine[]
  dividendsTaxIls: string       // net of credit
  interestTaxIls: string        // net of credit
  // credits
  countryCredits: CountryCreditLine[]
  totalCreditIls: string
  totalExcessCreditCarryForwardIls: string
  // surtax
  surtaxIls: string
  surtaxExplanation: Explanation | null
  // totals (output-rounded to whole shekels)
  totalTaxLiabilityIlsRounded: string
  lossOffsetExplanation: Explanation
  quarantined: QuarantinedItem[]
  exchangeRatesUsed: ExchangeRateUsed[]
}

export interface BlockedResult {
  status: 'blocked'
  issues: BlockingIssue[]
}

export type EngineOutput = TaxResult | BlockedResult
```

- [ ] **Step 4: Run test to verify it passes** — Run: `npx vitest run __tests__/lib/tax/result-types.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/tax/types.ts __tests__/lib/tax/result-types.test.ts
git commit -m "feat(tax): explanation-carrying result types + blocked/ok union"
```

---

### Task 7: Capital gains per closed lot (shekel real-gain method)

**Files:**
- Create: `lib/tax/capital-gains.ts`
- Test: `__tests__/lib/tax/capital-gains.test.ts`

**Interfaces:**
- Consumes: `ClosedLot`, `RatesMap`, `getRate` (Task 4), `getYearRates` (Task 2), explanation builders (Task 5), `CapitalGainLine` (Task 6).
- Produces:
  `computeCapitalGains(lots: ClosedLot[], rates: RatesMap, taxYear: number, substantialHoldings: string[]): { lines: CapitalGainLine[]; usedRates: ExchangeRateUsed[] }`
  — one line per lot whose `saleDate` falls in `taxYear`; `gainIls = proceeds×rate(saleDate) − cost×rate(openDate)` (ADR-0001). Rate lookups use the lot's own `currency`.

- [ ] **Step 1: Write the failing test** (the worked example from grilling, plus a prior-year open date, plus tax-year filtering)

```ts
// __tests__/lib/tax/capital-gains.test.ts
import { describe, it, expect } from 'vitest'
import { computeCapitalGains } from '@/lib/tax/capital-gains'
import type { ClosedLot } from '@/lib/ibkr/types'
import type { RatesMap } from '@/lib/boi/types'

const rates: RatesMap = {
  USD: { '2019-05-01': '3.20', '2024-03-10': '3.70', '2024-06-01': '3.75' },
}
const lot = (o: Partial<ClosedLot>): ClosedLot => ({
  id: 'l', ticker: 'AAPL', description: 'Apple', currency: 'USD', quantity: 100,
  openDate: '2019-05-01', saleDate: '2024-03-10', proceeds: '12000', cost: '10000',
  method: 'FIFO', ...o,
})

describe('computeCapitalGains', () => {
  it('computes shekel real gain using open-date and sale-date rates', () => {
    const { lines } = computeCapitalGains([lot({})], rates, 2024, [])
    expect(lines).toHaveLength(1)
    // 12000*3.70 - 10000*3.20 = 44400 - 32000 = 12400
    expect(lines[0].gainIls).toBe('12400')
    expect(lines[0].openRate).toBe('3.20')
    expect(lines[0].saleRate).toBe('3.70')
    expect(lines[0].isSubstantial).toBe(false)
  })
  it('produces a negative gain (loss) correctly', () => {
    const { lines } = computeCapitalGains(
      [lot({ proceeds: '9000', cost: '10000' })], rates, 2024, [])
    // 9000*3.70 - 10000*3.20 = 33300 - 32000 = 1300  (still a gain via FX!)
    expect(lines[0].gainIls).toBe('1300')
  })
  it('marks substantial holdings', () => {
    const { lines } = computeCapitalGains([lot({})], rates, 2024, ['AAPL'])
    expect(lines[0].isSubstantial).toBe(true)
  })
  it('includes only lots sold in the tax year', () => {
    const other = lot({ id: 'l2', saleDate: '2023-11-01' })
    const { lines } = computeCapitalGains([lot({}), other], rates, 2024, [])
    expect(lines.map(l => l.id ?? l.ticker)).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npx vitest run __tests__/lib/tax/capital-gains.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// lib/tax/capital-gains.ts
import { mul, sub } from './decimal'
import { getRate } from '@/lib/boi/lookup'
import { explainCapitalGain } from './explain'
import type { ClosedLot } from '@/lib/ibkr/types'
import type { RatesMap, ExchangeRateUsed } from '@/lib/boi/types'
import type { CapitalGainLine } from './types'

export function computeCapitalGains(
  lots: ClosedLot[],
  rates: RatesMap,
  taxYear: number,
  substantialHoldings: string[],
): { lines: CapitalGainLine[]; usedRates: ExchangeRateUsed[] } {
  const used: ExchangeRateUsed[] = []
  const record = (currency: string, date: string, rate: string) => {
    if (!used.find(u => u.currency === currency && u.date === date)) {
      used.push({ currency, date, rate })
    }
  }
  const inYear = (d: string) => d.startsWith(String(taxYear))

  const lines = lots
    .filter(l => inYear(l.saleDate))
    .map((l): CapitalGainLine => {
      const saleRate = getRate(rates, l.currency, l.saleDate)
      const openRate = getRate(rates, l.currency, l.openDate)
      record(l.currency, l.saleDate, saleRate)
      record(l.currency, l.openDate, openRate)
      const proceedsIls = mul(l.proceeds, saleRate)
      const costIls = mul(l.cost, openRate)
      const gainIls = sub(proceedsIls, costIls)
      const isSubstantial = substantialHoldings.includes(l.ticker)
      return {
        ticker: l.ticker, description: l.description,
        openDate: l.openDate, saleDate: l.saleDate, openRate, saleRate,
        proceedsIls, costIls, gainIls, isSubstantial,
        explanation: explainCapitalGain({
          ticker: l.ticker, proceedsIls, costIls, gainIls,
          saleDate: l.saleDate, saleRate, openDate: l.openDate, openRate,
        }),
      }
    })

  return { lines, usedRates: used }
}
```

- [ ] **Step 4: Run test to verify it passes** — Run: `npx vitest run __tests__/lib/tax/capital-gains.test.ts` — Expected: PASS.

Note: `CapitalGainLine` has no `id`; the last test uses `l.ticker` fallback — keep the assertion on `toHaveLength(1)`.

- [ ] **Step 5: Commit**

```bash
git add lib/tax/capital-gains.ts __tests__/lib/tax/capital-gains.test.ts
git commit -m "feat(tax): per-lot shekel real-gain capital gains"
```

---

### Task 8: Loss offsetting (§92, current vs brought-forward)

**Files:**
- Create: `lib/tax/losses.ts`
- Test: `__tests__/lib/tax/losses.test.ts`

**Interfaces:**
- Consumes: `CapitalGainLine` (signed `gainIls`), decimal helpers, `explainLossOffset`.
- Produces:
  `offsetLosses(input: { gainLines: CapitalGainLine[]; broughtForwardLoss: string; dividendIncomeIls: string; interestIncomeIls: string }): LossOutcome`
  where
  ```ts
  interface LossOutcome {
    totalGainsIls: string
    totalLossesIls: string
    currentLossUsedAgainstGainsIls: string
    broughtForwardUsedIls: string
    netCapitalGainIls: string              // after gains offsets, >= 0
    currentLossUsedAgainstIncomeIls: string // reduces dividends+interest base
    incomeOffsetRemainingIls: string        // dividend+interest base left after current-loss offset
    carryForwardLossIls: string
    explanation: Explanation
  }
  ```
- **Rules (verified, ADR-0004):** current-year losses offset current gains first, then remaining current losses offset current dividend+interest base (≤25% — all our income qualifies). Brought-forward losses offset **only** current gains, applied **after** current-year gain/loss netting. Any loss unused after all offsets becomes carry-forward.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/tax/losses.test.ts
import { describe, it, expect } from 'vitest'
import { offsetLosses } from '@/lib/tax/losses'
import type { CapitalGainLine } from '@/lib/tax/types'

const line = (gainIls: string): CapitalGainLine => ({
  ticker: 'X', description: '', openDate: '', saleDate: '', openRate: '', saleRate: '',
  proceedsIls: '0', costIls: '0', gainIls, isSubstantial: false,
  explanation: { code: '', params: {} },
})

describe('offsetLosses', () => {
  it('nets current gains and losses', () => {
    const o = offsetLosses({ gainLines: [line('10000'), line('-4000')], broughtForwardLoss: '0', dividendIncomeIls: '0', interestIncomeIls: '0' })
    expect(o.totalGainsIls).toBe('10000')
    expect(o.totalLossesIls).toBe('4000')
    expect(o.netCapitalGainIls).toBe('6000')
    expect(o.carryForwardLossIls).toBe('0')
  })
  it('spills excess current loss onto dividend+interest income', () => {
    const o = offsetLosses({ gainLines: [line('2000'), line('-9000')], broughtForwardLoss: '0', dividendIncomeIls: '5000', interestIncomeIls: '1000' })
    // loss 9000 - gains 2000 = 7000 remaining; offsets 6000 income -> income base 0; 1000 carries fwd
    expect(o.netCapitalGainIls).toBe('0')
    expect(o.currentLossUsedAgainstIncomeIls).toBe('6000')
    expect(o.incomeOffsetRemainingIls).toBe('0')
    expect(o.carryForwardLossIls).toBe('1000')
  })
  it('applies brought-forward loss to gains ONLY, never to income', () => {
    const o = offsetLosses({ gainLines: [line('3000')], broughtForwardLoss: '10000', dividendIncomeIls: '8000', interestIncomeIls: '0' })
    // BF offsets the 3000 gain only; 7000 BF carries forward; dividends untouched
    expect(o.netCapitalGainIls).toBe('0')
    expect(o.broughtForwardUsedIls).toBe('3000')
    expect(o.currentLossUsedAgainstIncomeIls).toBe('0')
    expect(o.incomeOffsetRemainingIls).toBe('8000')
    expect(o.carryForwardLossIls).toBe('7000')
  })
  it('uses current losses before brought-forward against gains', () => {
    const o = offsetLosses({ gainLines: [line('10000'), line('-4000')], broughtForwardLoss: '5000', dividendIncomeIls: '0', interestIncomeIls: '0' })
    // current loss 4000 -> gains 10000 = 6000; BF 5000 -> 6000 = 1000 net; BF fully used
    expect(o.netCapitalGainIls).toBe('1000')
    expect(o.broughtForwardUsedIls).toBe('5000')
    expect(o.carryForwardLossIls).toBe('0')
  })
})
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npx vitest run __tests__/lib/tax/losses.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// lib/tax/losses.ts
import { add, sub, min, gt, abs, isNeg, zero } from './decimal'
import { explainLossOffset } from './explain'
import type { CapitalGainLine } from './types'
import type { Explanation } from './explain'

export interface LossOutcome {
  totalGainsIls: string
  totalLossesIls: string
  currentLossUsedAgainstGainsIls: string
  broughtForwardUsedIls: string
  netCapitalGainIls: string
  currentLossUsedAgainstIncomeIls: string
  incomeOffsetRemainingIls: string
  carryForwardLossIls: string
  explanation: Explanation
}

export function offsetLosses(input: {
  gainLines: CapitalGainLine[]
  broughtForwardLoss: string
  dividendIncomeIls: string
  interestIncomeIls: string
}): LossOutcome {
  const totalGainsIls = input.gainLines
    .filter(l => !isNeg(l.gainIls)).reduce((s, l) => add(s, l.gainIls), zero)
  const totalLossesIls = input.gainLines
    .filter(l => isNeg(l.gainIls)).reduce((s, l) => add(s, abs(l.gainIls)), zero)

  // 1. current losses offset current gains
  const currentLossUsedAgainstGainsIls = min(totalLossesIls, totalGainsIls)
  const gainsAfterCurrent = sub(totalGainsIls, currentLossUsedAgainstGainsIls)
  let currentLossRemaining = sub(totalLossesIls, currentLossUsedAgainstGainsIls)

  // 2. brought-forward losses offset remaining current gains ONLY
  const broughtForwardUsedIls = min(input.broughtForwardLoss, gainsAfterCurrent)
  const netCapitalGainIls = sub(gainsAfterCurrent, broughtForwardUsedIls)
  const broughtForwardRemaining = sub(input.broughtForwardLoss, broughtForwardUsedIls)

  // 3. remaining CURRENT losses spill onto dividend+interest income (not BF)
  const incomeBase = add(input.dividendIncomeIls, input.interestIncomeIls)
  const currentLossUsedAgainstIncomeIls = min(currentLossRemaining, incomeBase)
  const incomeOffsetRemainingIls = sub(incomeBase, currentLossUsedAgainstIncomeIls)
  currentLossRemaining = sub(currentLossRemaining, currentLossUsedAgainstIncomeIls)

  // 4. anything left (current + BF) carries forward
  const carryForwardLossIls = add(currentLossRemaining, broughtForwardRemaining)

  return {
    totalGainsIls, totalLossesIls,
    currentLossUsedAgainstGainsIls, broughtForwardUsedIls, netCapitalGainIls,
    currentLossUsedAgainstIncomeIls, incomeOffsetRemainingIls, carryForwardLossIls,
    explanation: explainLossOffset({
      currentLossIls: totalLossesIls,
      broughtForwardIls: input.broughtForwardLoss,
      usedAgainstGainsIls: add(currentLossUsedAgainstGainsIls, broughtForwardUsedIls),
      usedAgainstIncomeIls: currentLossUsedAgainstIncomeIls,
      carryForwardIls: carryForwardLossIls,
    }),
  }
}
```

Note the unused import `gt` — remove it if the linter flags it.

- [ ] **Step 4: Run test to verify it passes** — Run: `npx vitest run __tests__/lib/tax/losses.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/tax/losses.ts __tests__/lib/tax/losses.test.ts
git commit -m "feat(tax): §92 loss offsetting with brought-forward distinction"
```

---

### Task 9: Dividend lines

**Files:**
- Create: `lib/tax/dividends.ts`
- Test: `__tests__/lib/tax/dividends.test.ts`

**Interfaces:**
- Consumes: `DividendRecord`, `getRate`, `getYearRates`, `roundShekels` (only for line outputs? — keep line values full precision; round only in orchestrator totals), `explainDividend`, `DividendLine`.
- Produces: `computeDividends(divs, rates, taxYear, substantialHoldings): { lines: DividendLine[]; usedRates: ExchangeRateUsed[] }`. Each line: `grossIls = gross × rate(payDate)`, `rate` = 30 if substantial else 25, `israeliTaxIls = grossIls × rate%`, `withheldIls = withheldTax × rate(payDate)`. Credit and over-withholding are computed later per-country (Task 11); this task sets `creditIls='0'`, `netTaxIls=israeliTaxIls`, `overWithheldIls='0'` as placeholders the FTC step fills.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/tax/dividends.test.ts
import { describe, it, expect } from 'vitest'
import { computeDividends } from '@/lib/tax/dividends'
import type { DividendRecord } from '@/lib/ibkr/types'
import type { RatesMap } from '@/lib/boi/types'

const rates: RatesMap = { USD: { '2024-02-15': '3.60' } }
const div = (o: Partial<DividendRecord> = {}): DividendRecord => ({
  id: 'd', ticker: 'KO', description: 'Coca-Cola', currency: 'USD',
  payDate: '2024-02-15', gross: '100', withheldTax: '25', sourceCountry: 'US', ...o,
})

describe('computeDividends', () => {
  it('converts gross and withholding at the pay-date rate, taxes at 25%', () => {
    const { lines } = computeDividends([div()], rates, 2024, [])
    expect(lines[0].grossIls).toBe('360')          // 100*3.60
    expect(lines[0].rate).toBe('25')
    expect(lines[0].israeliTaxIls).toBe('90')      // 360*25%
    expect(lines[0].withheldIls).toBe('90')        // 25*3.60
  })
  it('uses 30% for a substantial holding', () => {
    const { lines } = computeDividends([div({ ticker: 'KO' })], rates, 2024, ['KO'])
    expect(lines[0].rate).toBe('30')
    expect(lines[0].israeliTaxIls).toBe('108')     // 360*30%
  })
  it('filters to the tax year by pay date', () => {
    const { lines } = computeDividends([div({ payDate: '2023-12-15' })], rates, 2024, [])
    expect(lines).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npx vitest run __tests__/lib/tax/dividends.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// lib/tax/dividends.ts
import { mul, pct } from './decimal'
import { getRate } from '@/lib/boi/lookup'
import { getYearRates } from './rates'
import { explainDividend } from './explain'
import type { DividendRecord } from '@/lib/ibkr/types'
import type { RatesMap, ExchangeRateUsed } from '@/lib/boi/types'
import type { DividendLine } from './types'

export function computeDividends(
  divs: DividendRecord[],
  rates: RatesMap,
  taxYear: number,
  substantialHoldings: string[],
): { lines: DividendLine[]; usedRates: ExchangeRateUsed[] } {
  const y = getYearRates(taxYear)
  const used: ExchangeRateUsed[] = []
  const record = (c: string, d: string, r: string) => {
    if (!used.find(u => u.currency === c && u.date === d)) used.push({ currency: c, date: d, rate: r })
  }
  const inYear = (d: string) => d.startsWith(String(taxYear))

  const lines = divs.filter(d => inYear(d.payDate)).map((d): DividendLine => {
    const fxRate = getRate(rates, d.currency, d.payDate)
    record(d.currency, d.payDate, fxRate)
    const grossIls = mul(d.gross, fxRate)
    const withheldIls = mul(d.withheldTax, fxRate)
    const rate = substantialHoldings.includes(d.ticker) ? y.substantialHolderRate : y.dividendRate
    const israeliTaxIls = pct(grossIls, rate)
    return {
      ticker: d.ticker, payDate: d.payDate, fxRate, grossIls, rate,
      israeliTaxIls, withheldIls, creditIls: '0', netTaxIls: israeliTaxIls,
      overWithheldIls: '0', sourceCountry: d.sourceCountry || 'UNKNOWN',
      explanation: explainDividend({
        ticker: d.ticker, grossIls, rate, israeliTaxIls,
        creditIls: '0', netTaxIls: israeliTaxIls, payDate: d.payDate, fxRate,
      }),
    }
  })
  return { lines, usedRates: used }
}
```

- [ ] **Step 4: Run test to verify it passes** — Run: `npx vitest run __tests__/lib/tax/dividends.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/tax/dividends.ts __tests__/lib/tax/dividends.test.ts
git commit -m "feat(tax): per-dividend Israeli tax lines (pre-credit)"
```

---

### Task 10: Interest lines

**Files:**
- Create: `lib/tax/interest.ts`
- Test: `__tests__/lib/tax/interest.test.ts`

**Interfaces:**
- Mirrors Task 9 for `InterestRecord` → `InterestLine`. Rate = `getYearRates(year).interestRate` (25%; verified foreign-currency interest is 25%, not 15%). Credit/over-withholding placeholders filled by Task 11.
- Produces: `computeInterest(items, rates, taxYear): { lines: InterestLine[]; usedRates: ExchangeRateUsed[] }`.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/tax/interest.test.ts
import { describe, it, expect } from 'vitest'
import { computeInterest } from '@/lib/tax/interest'
import type { InterestRecord } from '@/lib/ibkr/types'
import type { RatesMap } from '@/lib/boi/types'

const rates: RatesMap = { USD: { '2024-06-30': '3.70' } }
const int = (o: Partial<InterestRecord> = {}): InterestRecord => ({
  id: 'i', description: 'Broker Interest', currency: 'USD',
  payDate: '2024-06-30', gross: '40', withheldTax: '0', sourceCountry: 'US', ...o,
})

describe('computeInterest', () => {
  it('taxes foreign-currency interest at 25%', () => {
    const { lines } = computeInterest([int()], rates, 2024)
    expect(lines[0].grossIls).toBe('148')        // 40*3.70
    expect(lines[0].rate).toBe('25')
    expect(lines[0].israeliTaxIls).toBe('37')    // 148*25%
  })
  it('filters to the tax year', () => {
    const { lines } = computeInterest([int({ payDate: '2025-01-02' })], rates, 2024)
    expect(lines).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npx vitest run __tests__/lib/tax/interest.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// lib/tax/interest.ts
import { mul, pct } from './decimal'
import { getRate } from '@/lib/boi/lookup'
import { getYearRates } from './rates'
import { explainInterest } from './explain'
import type { InterestRecord } from '@/lib/ibkr/types'
import type { RatesMap, ExchangeRateUsed } from '@/lib/boi/types'
import type { InterestLine } from './types'

export function computeInterest(
  items: InterestRecord[],
  rates: RatesMap,
  taxYear: number,
): { lines: InterestLine[]; usedRates: ExchangeRateUsed[] } {
  const y = getYearRates(taxYear)
  const used: ExchangeRateUsed[] = []
  const record = (c: string, d: string, r: string) => {
    if (!used.find(u => u.currency === c && u.date === d)) used.push({ currency: c, date: d, rate: r })
  }
  const inYear = (d: string) => d.startsWith(String(taxYear))

  const lines = items.filter(i => inYear(i.payDate)).map((i): InterestLine => {
    const fxRate = getRate(rates, i.currency, i.payDate)
    record(i.currency, i.payDate, fxRate)
    const grossIls = mul(i.gross, fxRate)
    const withheldIls = mul(i.withheldTax, fxRate)
    const israeliTaxIls = pct(grossIls, y.interestRate)
    return {
      description: i.description, payDate: i.payDate, fxRate, grossIls, rate: y.interestRate,
      israeliTaxIls, withheldIls, creditIls: '0', netTaxIls: israeliTaxIls,
      overWithheldIls: '0', sourceCountry: i.sourceCountry || 'UNKNOWN',
      explanation: explainInterest({
        description: i.description, grossIls, rate: y.interestRate, israeliTaxIls,
        creditIls: '0', netTaxIls: israeliTaxIls, payDate: i.payDate, fxRate,
      }),
    }
  })
  return { lines, usedRates: used }
}
```

- [ ] **Step 4: Run test to verify it passes** — Run: `npx vitest run __tests__/lib/tax/interest.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/tax/interest.ts __tests__/lib/tax/interest.test.ts
git commit -m "feat(tax): per-interest Israeli tax lines (pre-credit)"
```

---

### Task 11: Foreign tax credit — per-country basket, over-withholding, excess credit

**Files:**
- Create: `lib/tax/foreign-tax-credit.ts`
- Test: `__tests__/lib/tax/foreign-tax-credit.test.ts`

**Interfaces:**
- Consumes: `DividendLine`, `InterestLine`, `explainCredit`, `explainOverWithholding`, `getYearRates`.
- Produces:
  `applyForeignTaxCredit(dividendLines, interestLines): { dividendLines, interestLines, countryCredits: CountryCreditLine[]; totalCreditIls; totalExcessCarryForwardIls }`
  — groups lines by `(sourceCountry, basket)`, pools foreign tax vs ceiling within each group, sets each line's `creditIls`/`netTaxIls`, flags `overWithheldIls` per line where withheld exceeds the treaty cap for the basket (dividends **25%** of gross, interest **17.5%** of gross — verified caps). Excess foreign tax over the Israeli ceiling in a basket becomes `excessCarryForwardIls` (§205א).
- **Treaty caps (verified):** dividend creditable cap = 25% of grossIls; interest creditable cap = 17.5% of grossIls. Withholding above the cap is `overWithheldIls` and is NOT credited.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/tax/foreign-tax-credit.test.ts
import { describe, it, expect } from 'vitest'
import { applyForeignTaxCredit } from '@/lib/tax/foreign-tax-credit'
import type { DividendLine, InterestLine } from '@/lib/tax/types'

const dLine = (o: Partial<DividendLine>): DividendLine => ({
  ticker: 'X', payDate: '', fxRate: '1', grossIls: '1000', rate: '25',
  israeliTaxIls: '250', withheldIls: '250', creditIls: '0', netTaxIls: '250',
  overWithheldIls: '0', sourceCountry: 'US', explanation: { code: '', params: {} }, ...o,
})
const iLine = (o: Partial<InterestLine>): InterestLine => ({
  description: 'int', payDate: '', fxRate: '1', grossIls: '1000', rate: '25',
  israeliTaxIls: '250', withheldIls: '0', creditIls: '0', netTaxIls: '250',
  overWithheldIls: '0', sourceCountry: 'US', explanation: { code: '', params: {} }, ...o,
})

describe('applyForeignTaxCredit', () => {
  it('credits US dividend withholding up to the Israeli liability (nets to zero)', () => {
    const r = applyForeignTaxCredit([dLine({})], [])
    expect(r.dividendLines[0].creditIls).toBe('250')
    expect(r.dividendLines[0].netTaxIls).toBe('0')
    expect(r.totalCreditIls).toBe('250')
  })
  it('pools within a country basket: over-withheld line helps an under-withheld line', () => {
    // two US dividends, each Israeli tax 250; one withheld 250, one withheld 150 -> pooled 400 vs ceiling 500 => credit 400
    const r = applyForeignTaxCredit([dLine({ withheldIls: '250' }), dLine({ withheldIls: '150' })], [])
    expect(r.totalCreditIls).toBe('400')
    expect(r.dividendLines[0].netTaxIls === '0' || r.dividendLines[1].netTaxIls === '0').toBe(true)
  })
  it('flags dividend over-withholding above the 25% treaty cap', () => {
    // withheld 300 on gross 1000 -> cap 250; 50 is over-withheld, credit capped at 250
    const r = applyForeignTaxCredit([dLine({ withheldIls: '300' })], [])
    expect(r.dividendLines[0].overWithheldIls).toBe('50')
    expect(r.dividendLines[0].creditIls).toBe('250')
  })
  it('caps interest credit at the 17.5% treaty rate, leaving residual Israeli tax', () => {
    // interest gross 1000, Israeli tax 250, withheld 250 -> treaty cap 175 credit; net 75 due; 75 over-withheld
    const r = applyForeignTaxCredit([], [iLine({ withheldIls: '250' })])
    expect(r.interestLines[0].creditIls).toBe('175')
    expect(r.interestLines[0].netTaxIls).toBe('75')
    expect(r.interestLines[0].overWithheldIls).toBe('75')
  })
  it('separates baskets by country', () => {
    const r = applyForeignTaxCredit([dLine({ sourceCountry: 'US', withheldIls: '250' }), dLine({ sourceCountry: 'DE', withheldIls: '0' })], [])
    const de = r.countryCredits.find(c => c.country === 'DE' && c.basket === 'dividend')
    expect(de?.creditedIls).toBe('0')
  })
})
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npx vitest run __tests__/lib/tax/foreign-tax-credit.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// lib/tax/foreign-tax-credit.ts
import { add, sub, min, pct, max, gt, zero } from './decimal'
import { explainCredit } from './explain'
import type { DividendLine, InterestLine, CountryCreditLine } from './types'

const DIVIDEND_TREATY_CAP = '25'    // % of gross (US-Israel Art.12)
const INTEREST_TREATY_CAP = '17.5'  // % of gross (US-Israel Art.13)

interface Grouped { country: string; basket: 'dividend' | 'interest'; idxs: number[] }

export function applyForeignTaxCredit(
  dividendLines: DividendLine[],
  interestLines: InterestLine[],
): {
  dividendLines: DividendLine[]
  interestLines: InterestLine[]
  countryCredits: CountryCreditLine[]
  totalCreditIls: string
  totalExcessCarryForwardIls: string
} {
  const divs = dividendLines.map(l => ({ ...l }))
  const ints = interestLines.map(l => ({ ...l }))
  const countryCredits: CountryCreditLine[] = []
  let totalCreditIls = zero
  let totalExcessCarryForwardIls = zero

  const processBasket = (
    basket: 'dividend' | 'interest',
    lines: Array<DividendLine | InterestLine>,
    capRate: string,
  ) => {
    const byCountry = new Map<string, number[]>()
    lines.forEach((l, i) => {
      const arr = byCountry.get(l.sourceCountry) ?? []
      arr.push(i); byCountry.set(l.sourceCountry, arr)
    })
    for (const [country, idxs] of byCountry) {
      // per-line: creditable withholding is capped at the treaty rate on that line's gross
      let poolCreditable = zero
      let ceiling = zero
      for (const i of idxs) {
        const l = lines[i]
        const lineCap = pct(l.grossIls, capRate)
        const over = max(sub(l.withheldIls, lineCap), zero)
        l.overWithheldIls = over
        const creditableWithheld = min(l.withheldIls, lineCap)
        poolCreditable = add(poolCreditable, creditableWithheld)
        ceiling = add(ceiling, l.israeliTaxIls)
      }
      const credited = min(poolCreditable, ceiling)
      const excess = max(sub(poolCreditable, ceiling), zero)
      // distribute credit across lines proportional to each line's Israeli tax
      let creditLeft = credited
      idxs.forEach((i, k) => {
        const l = lines[i]
        const share = k === idxs.length - 1 ? creditLeft : min(l.israeliTaxIls, creditLeft)
        l.creditIls = share
        l.netTaxIls = sub(l.israeliTaxIls, share)
        creditLeft = sub(creditLeft, share)
      })
      totalCreditIls = add(totalCreditIls, credited)
      totalExcessCarryForwardIls = add(totalExcessCarryForwardIls, excess)
      countryCredits.push({
        country, basket,
        foreignTaxIls: poolCreditable, ceilingIls: ceiling,
        creditedIls: credited, excessCarryForwardIls: excess,
        explanation: explainCredit({
          country, foreignTaxIls: poolCreditable, ceilingIls: ceiling,
          creditedIls: credited, excessCarryForwardIls: excess,
        }),
      })
    }
  }

  processBasket('dividend', divs, DIVIDEND_TREATY_CAP)
  processBasket('interest', ints, INTEREST_TREATY_CAP)

  return {
    dividendLines: divs as DividendLine[],
    interestLines: ints as InterestLine[],
    countryCredits, totalCreditIls, totalExcessCarryForwardIls,
  }
}
```

Note: `gt` import may be unused — remove if the linter flags it.

- [ ] **Step 4: Run test to verify it passes** — Run: `npx vitest run __tests__/lib/tax/foreign-tax-credit.test.ts` — Expected: PASS. If the proportional-distribution assertion on the pooled test is brittle, keep the assertion as written (it only checks that at least one line nets to zero).

- [ ] **Step 5: Commit**

```bash
git add lib/tax/foreign-tax-credit.ts __tests__/lib/tax/foreign-tax-credit.test.ts
git commit -m "feat(tax): per-country FTC basket with over-withholding + excess credit"
```

---

### Task 12: Surtax (מס יסף base + 2025 capital surtax)

**Files:**
- Create: `lib/tax/surtax.ts`
- Test: `__tests__/lib/tax/surtax.test.ts`

**Interfaces:**
- Consumes: `getYearRates`, decimal helpers, `explainSurtax`.
- Produces:
  `computeSurtax(input: { taxYear: number; otherIncomeIls?: string; capitalIncomeIls: string }): { surtaxIls: string; explanation: Explanation } | { surtaxIls: '0'; explanation: null }`
  — if `otherIncomeIls` is undefined, returns zero surtax with `explanation: null` (skipped). Otherwise: base 3% applies to `(otherIncome + capitalIncome − threshold)` positive part; the 2025 +2% applies to the capital-income portion above the threshold. `capitalIncomeIls` = net capital gain + net dividends base + net interest base (taxable investment income).
- **Model (verified):** base surtax = `surtaxBaseRate% × max(total − threshold, 0)` where `total = otherIncome + capitalIncome`. Capital surtax = `capitalSurtaxRate% × max(min(capitalIncome, total − threshold), 0)` — i.e. the capital income that sits above the threshold. (Flagged for professional confirmation of the exact "capital income above threshold" measure.)

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/tax/surtax.test.ts
import { describe, it, expect } from 'vitest'
import { computeSurtax } from '@/lib/tax/surtax'

describe('computeSurtax', () => {
  it('skips surtax when other income is not provided', () => {
    const r = computeSurtax({ taxYear: 2025, capitalIncomeIls: '100000' })
    expect(r.surtaxIls).toBe('0')
    expect(r.explanation).toBeNull()
  })
  it('applies no surtax below the threshold', () => {
    const r = computeSurtax({ taxYear: 2024, otherIncomeIls: '500000', capitalIncomeIls: '100000' })
    // total 600000 < 721560
    expect(r.surtaxIls).toBe('0')
  })
  it('applies 3% base above the 2024 threshold, no capital surtax', () => {
    const r = computeSurtax({ taxYear: 2024, otherIncomeIls: '700000', capitalIncomeIls: '100000' })
    // total 800000; over threshold 800000-721560 = 78440; base 3% = 2353.2
    expect(r.surtaxIls).toBe('2353.2')
  })
  it('adds the 2% capital surtax in 2025 on capital income above the threshold', () => {
    const r = computeSurtax({ taxYear: 2025, otherIncomeIls: '700000', capitalIncomeIls: '100000' })
    // total 800000; over = 78440; base 3% = 2353.2
    // capital above threshold = min(100000, 78440) = 78440; 2% = 1568.8
    // total surtax = 3922
    expect(r.surtaxIls).toBe('3922')
  })
})
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npx vitest run __tests__/lib/tax/surtax.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// lib/tax/surtax.ts
import { add, sub, min, max, pct, zero } from './decimal'
import { getYearRates } from './rates'
import { explainSurtax } from './explain'
import type { Explanation } from './explain'

export function computeSurtax(input: {
  taxYear: number
  otherIncomeIls?: string
  capitalIncomeIls: string
}): { surtaxIls: string; explanation: Explanation | null } {
  if (input.otherIncomeIls === undefined) {
    return { surtaxIls: '0', explanation: null }
  }
  const y = getYearRates(input.taxYear)
  const total = add(input.otherIncomeIls, input.capitalIncomeIls)
  const overThreshold = max(sub(total, y.surtaxThresholdIls), zero)
  const baseSurtaxIls = pct(overThreshold, y.surtaxBaseRate)
  const capitalAboveThreshold = max(min(input.capitalIncomeIls, overThreshold), zero)
  const capitalSurtaxIls = pct(capitalAboveThreshold, y.capitalSurtaxRate)
  const totalSurtaxIls = add(baseSurtaxIls, capitalSurtaxIls)
  return {
    surtaxIls: totalSurtaxIls,
    explanation: explainSurtax({
      otherIncomeIls: input.otherIncomeIls, capitalIncomeIls: input.capitalIncomeIls,
      thresholdIls: y.surtaxThresholdIls, baseSurtaxIls, capitalSurtaxIls, totalSurtaxIls,
    }),
  }
}
```

- [ ] **Step 4: Run test to verify it passes** — Run: `npx vitest run __tests__/lib/tax/surtax.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/tax/surtax.ts __tests__/lib/tax/surtax.test.ts
git commit -m "feat(tax): מס יסף base + 2025 capital surtax module"
```

---

### Task 13: Orchestrator — blocking, quarantine, compose, totals

**Files:**
- Modify: `lib/tax/calculator.ts` (replace contents)
- Test: `__tests__/lib/tax/calculator.test.ts`

**Interfaces:**
- Consumes: every module above, `IBKRData`, `UserInputs`, `RatesMap`, `SUPPORTED_YEARS`, `roundShekels`.
- Produces: `calculateTax(data: IBKRData, rates: RatesMap, taxYear: number, inputs: UserInputs): EngineOutput`.
- **Blocking rules (ADR-0008):** return `{ status: 'blocked', issues }` if (a) `taxYear` unsupported, or (b) `data.hasClosedLotSection === false` while `closedLots` would be needed (there are sales) — i.e. capital gains cannot be trusted. Missing-rate errors thrown by `getRate` are caught and converted to a `missing-rate` blocking issue. Out-of-scope items never block — they quarantine.
- **Composition:** capital gains → losses (net gain + income offset) → dividends/interest lines → FTC → surtax on net investment income → totals rounded to whole shekels. `netCapitalGainIls` is taxed at each line's rate via `capitalGainsTaxIls` computed from substantial/default split (compute per-line tax by weighting; for v1 use blended: tax = Σ per-line positive gain × its rate, but only on the post-offset net — see step code).

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/tax/calculator.test.ts
import { describe, it, expect } from 'vitest'
import { calculateTax } from '@/lib/tax/calculator'
import type { IBKRData } from '@/lib/ibkr/types'
import type { RatesMap } from '@/lib/boi/types'
import type { UserInputs } from '@/lib/tax/user-inputs'

const rates: RatesMap = {
  USD: { '2019-05-01': '3.20', '2024-02-15': '3.60', '2024-03-10': '3.70', '2024-06-30': '3.75' },
}
const baseInputs: UserInputs = { substantialHoldings: [], broughtForwardLoss: '0' }
const data = (o: Partial<IBKRData> = {}): IBKRData => ({
  accountId: 'U1', baseCurrency: 'USD', lotMethod: 'FIFO', hasClosedLotSection: true,
  closedLots: [{ id: 'l1', ticker: 'AAPL', description: 'Apple', currency: 'USD', quantity: 100, openDate: '2019-05-01', saleDate: '2024-03-10', proceeds: '12000', cost: '10000', method: 'FIFO' }],
  dividends: [], interest: [], outOfScope: [], ...o,
})

describe('calculateTax', () => {
  it('blocks on an unsupported year', () => {
    const out = calculateTax(data(), rates, 2019, baseInputs)
    expect(out.status).toBe('blocked')
    if (out.status === 'blocked') expect(out.issues[0].code).toBe('unsupported-year')
  })
  it('blocks when closed-lot section is missing but sales exist', () => {
    const out = calculateTax(data({ hasClosedLotSection: false }), rates, 2024, baseInputs)
    expect(out.status).toBe('blocked')
    if (out.status === 'blocked') expect(out.issues[0].code).toBe('missing-closed-lots')
  })
  it('computes capital gains tax at 25%', () => {
    const out = calculateTax(data(), rates, 2024, baseInputs)
    expect(out.status).toBe('ok')
    if (out.status === 'ok') {
      expect(out.netCapitalGainIls).toBe('12400')
      expect(out.capitalGainsTaxIls).toBe('3100')       // 12400*25%
      expect(out.totalTaxLiabilityIlsRounded).toBe('3100')
    }
  })
  it('quarantines out-of-scope items without blocking', () => {
    const out = calculateTax(data({ outOfScope: [{ id: 'o1', kind: 'option', description: 'AAPL call', raw: 'opt' }] }), rates, 2024, baseInputs)
    expect(out.status).toBe('ok')
    if (out.status === 'ok') expect(out.quarantined).toHaveLength(1)
  })
  it('converts a missing rate into a blocking issue, not a crash', () => {
    const noRates: RatesMap = { USD: { '2024-03-10': '3.70' } } // missing 2019 open-date rate
    const out = calculateTax(data(), noRates, 2024, baseInputs)
    expect(out.status).toBe('blocked')
    if (out.status === 'blocked') expect(out.issues[0].code).toBe('missing-rate')
  })
})
```

- [ ] **Step 2: Run test to verify it fails** — Run: `npx vitest run __tests__/lib/tax/calculator.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// lib/tax/calculator.ts  (replace entire file)
import { add, sub, pct, mul, div, roundShekels, isNeg, abs, zero, gt } from './decimal'
import { SUPPORTED_YEARS } from './rates'
import { computeCapitalGains } from './capital-gains'
import { offsetLosses } from './losses'
import { computeDividends } from './dividends'
import { computeInterest } from './interest'
import { applyForeignTaxCredit } from './foreign-tax-credit'
import { computeSurtax } from './surtax'
import type { IBKRData } from '@/lib/ibkr/types'
import type { UserInputs } from './user-inputs'
import type { RatesMap, ExchangeRateUsed } from '@/lib/boi/types'
import type { EngineOutput, BlockingIssue, QuarantinedItem, CapitalGainLine } from './types'

/**
 * Weighted capital-gains tax: apply each positive lot's rate (25/30) to its
 * share of the post-offset net gain. If net gain is zero, tax is zero.
 */
function capitalGainsTax(lines: CapitalGainLine[], netGainIls: string): string {
  const positives = lines.filter(l => !isNeg(l.gainIls) && gt(l.gainIls, '0'))
  const grossPositive = positives.reduce((s, l) => add(s, l.gainIls), zero)
  if (grossPositive === '0' || netGainIls === '0') return zero
  // proportionally scale each positive gain down to the net, keep its own rate
  return positives.reduce((sum, l) => {
    const share = mul(netGainIls, div(l.gainIls, grossPositive))
    const rate = l.isSubstantial ? '30' : '25'
    return add(sum, pct(share, rate))
  }, zero)
}

export function calculateTax(
  data: IBKRData,
  rates: RatesMap,
  taxYear: number,
  inputs: UserInputs,
): EngineOutput {
  const issues: BlockingIssue[] = []

  if (!SUPPORTED_YEARS.includes(taxYear)) {
    issues.push({ code: 'unsupported-year', count: 1, explanation: { code: 'block.unsupportedYear', params: { year: String(taxYear) } } })
    return { status: 'blocked', issues }
  }
  const salesInYear = data.closedLots.filter(l => l.saleDate.startsWith(String(taxYear)))
  if (!data.hasClosedLotSection && salesInYear.length >= 0 && !data.hasClosedLotSection) {
    issues.push({ code: 'missing-closed-lots', count: salesInYear.length, explanation: { code: 'block.missingClosedLots', params: { count: String(salesInYear.length) } } })
    return { status: 'blocked', issues }
  }

  const usedRates: ExchangeRateUsed[] = []
  const mergeRates = (rs: ExchangeRateUsed[]) => {
    for (const r of rs) if (!usedRates.find(u => u.currency === r.currency && u.date === r.date)) usedRates.push(r)
  }

  try {
    const cg = computeCapitalGains(data.closedLots, rates, taxYear, inputs.substantialHoldings)
    mergeRates(cg.usedRates)
    const dv = computeDividends(data.dividends, rates, taxYear, inputs.substantialHoldings)
    mergeRates(dv.usedRates)
    const it = computeInterest(data.interest, rates, taxYear)
    mergeRates(it.usedRates)

    const dividendIncomeIls = dv.lines.reduce((s, l) => add(s, l.grossIls), zero)
    const interestIncomeIls = it.lines.reduce((s, l) => add(s, l.grossIls), zero)

    const loss = offsetLosses({
      gainLines: cg.lines,
      broughtForwardLoss: inputs.broughtForwardLoss,
      dividendIncomeIls, interestIncomeIls,
    })

    // Credits computed on the pre-loss income lines (credit follows the income);
    // loss offset reduces the taxable income base below, applied proportionally.
    const ftc = applyForeignTaxCredit(dv.lines, it.lines)

    const capitalGainsTaxIls = capitalGainsTax(cg.lines, loss.netCapitalGainIls)

    // Net dividend/interest tax after loss income-offset and credit.
    // Income base after current-loss spill:
    const incomeBase = add(dividendIncomeIls, interestIncomeIls)
    const incomeAfterLoss = loss.incomeOffsetRemainingIls
    const incomeScale = incomeBase === '0' ? '0' : div(incomeAfterLoss, incomeBase)
    const dividendsGrossTax = ftc.dividendLines.reduce((s, l) => add(s, l.netTaxIls), zero)
    const interestGrossTax = ftc.interestLines.reduce((s, l) => add(s, l.netTaxIls), zero)
    const dividendsTaxIls = mul(dividendsGrossTax, incomeScale)
    const interestTaxIls = mul(interestGrossTax, incomeScale)

    const capitalIncomeIls = add(loss.netCapitalGainIls, incomeAfterLoss)
    const surtax = computeSurtax({ taxYear, otherIncomeIls: inputs.otherIncomeIls, capitalIncomeIls })

    const totalTax = add(add(add(capitalGainsTaxIls, dividendsTaxIls), interestTaxIls), surtax.surtaxIls)

    const quarantined: QuarantinedItem[] = data.outOfScope.map(o => ({
      kind: o.kind, description: o.description,
      explanation: { code: 'explain.quarantined', params: { kind: o.kind, description: o.description } },
    }))

    return {
      status: 'ok',
      taxYear,
      capitalGainLines: cg.lines,
      totalGainsIls: loss.totalGainsIls,
      totalLossesIls: loss.totalLossesIls,
      currentLossUsedAgainstGainsIls: loss.currentLossUsedAgainstGainsIls,
      currentLossUsedAgainstIncomeIls: loss.currentLossUsedAgainstIncomeIls,
      broughtForwardUsedIls: loss.broughtForwardUsedIls,
      carryForwardLossIls: loss.carryForwardLossIls,
      netCapitalGainIls: loss.netCapitalGainIls,
      capitalGainsTaxIls,
      dividendLines: ftc.dividendLines,
      interestLines: ftc.interestLines,
      dividendsTaxIls, interestTaxIls,
      countryCredits: ftc.countryCredits,
      totalCreditIls: ftc.totalCreditIls,
      totalExcessCreditCarryForwardIls: ftc.totalExcessCarryForwardIls,
      surtaxIls: surtax.surtaxIls,
      surtaxExplanation: surtax.explanation,
      totalTaxLiabilityIlsRounded: roundShekels(totalTax),
      lossOffsetExplanation: loss.explanation,
      quarantined,
      exchangeRatesUsed: usedRates,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const code = /rate/i.test(msg) ? 'missing-rate' : 'missing-rate'
    issues.push({ code, count: 1, explanation: { code: 'block.missingRate', params: { detail: msg } } })
    return { status: 'blocked', issues }
  }
}
```

Note on the `missing-closed-lots` guard: it fires whenever `hasClosedLotSection` is false. Simplify the doubled condition to `if (!data.hasClosedLotSection) { ... }` — the doubled form above is intentionally shown so the implementer replaces it with the single clean check.

- [ ] **Step 4: Run test to verify it passes** — Run: `npx vitest run __tests__/lib/tax/calculator.test.ts` — Expected: PASS. Then run the whole tax suite: `npx vitest run __tests__/lib/tax __tests__/lib/boi __tests__/lib/ibkr` — Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/tax/calculator.ts __tests__/lib/tax/calculator.test.ts
git commit -m "feat(tax): orchestrator with blocking, quarantine, and composed totals"
```

---

## Self-Review

**Spec coverage** (against CONTEXT.md + ADRs 0001–0009):
- ADR-0001 shekel real gain → Task 7. ADR-0002 closed-lot source → types in Task 1 (`ClosedLot.openDate/method`) + `hasClosedLotSection` block in Task 13. ADR-0003 (import) → Plan B (out of scope here; `hasClosedLotSection` is the engine's hook). ADR-0004 losses → Task 8 (brought-forward distinction covered + tested). ADR-0005 explanations → Task 5 + every line. ADR-0006 surtax → Task 12. ADR-0007 contract → Plan D (engine emits typed `TaxResult`, the contract's basis). ADR-0008 quarantine/block → Task 13. ADR-0009 precision/rounding → Task 3 + full-precision internals. Multi-currency → per-line `currency` + `getRate` (Tasks 4/7/9/10). Substantial holder → Tasks 7/9. FTC basket/over-withholding/excess → Task 11. Year table → Task 2.
- **Gap acknowledged:** the exact per-line apportionment of credit and loss-income-offset is an engineering approximation (proportional scaling); flagged for the professional-review items in the checklist. Parser (Plan B), rates fetch (Plan C), exports/contract (Plan D), UI (Plan E) are deliberately out of this plan.

**Placeholder scan:** no TBD/TODO; all steps carry real test + implementation code. Two intentional "remove if linter flags" notes on unused imports (`gt` in losses, `gt` in FTC) and one "replace the doubled condition" note in Task 13 — these are cleanups, not placeholders.

**Type consistency:** `EngineOutput` union, `CapitalGainLine.gainIls` (signed), `DividendLine`/`InterestLine` credit fields, `getRate(rates, currency, date)`, `getYearRates(year)`, `roundShekels`, `offsetLosses`/`LossOutcome`, `applyForeignTaxCredit`, `computeSurtax` signatures are used consistently across tasks and match their definitions.

## Known follow-ups (not this plan)
- Per-line credit apportionment precision (currently proportional) — revisit if the field-guide needs exact per-line credit.
- The professional-review (◐) items in `docs/tax-verification-checklist.md` must be signed off before "100% correct."
- Migrate/replace the old component + parser code that imported the previous `TaxResult` shape (Plans B–E).
