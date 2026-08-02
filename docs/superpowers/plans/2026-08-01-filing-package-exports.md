# Filing Package Contract & Exports Implementation Plan (Plan D)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Turn the engine's `TaxResult` into the versioned **Filing Package** contract (ADR-0007) plus the human outputs — PDF, Excel, and the data behind the on-screen ITA field guide — mapping values to forms 1322/1325/1324/1301.

**Architecture:** A pure builder produces the versioned `FilingPackage` (the machine contract for the future full-1301 tool). A pure `field-map` maps result values to named ITA fields. PDF/Excel/field-guide renderers consume the `FilingPackage` — none re-derives tax numbers.

**Tech Stack:** TypeScript 5, jsPDF, ExcelJS, Vitest.

## Global Constraints
- The Filing Package is a **first-class versioned output** (ADR-0007): it carries `schemaVersion`, is pure JSON-serializable, and never depends on the UI.
- Renderers **must not compute tax** — they read the package only.
- Explanations (ADR-0005) ride along on every line so exports can render them.
- **ITA field/box numbers are a verify item** (checklist ◐): the field map is data-driven so numbers can be corrected without touching logic; each must be confirmed against the tax-year form PDF.
- Whole-shekel values (ADR-0009) come pre-rounded from the engine for output fields.

## File Structure
- `lib/reports/filing-package.ts` (create) — `FilingPackage` type + `buildFilingPackage(result, meta)`.
- `lib/reports/field-map.ts` (create) — `FieldMapping[]`, `mapToFields(result): MappedField[]`.
- `lib/reports/pdf.ts` (replace) — `generatePdf(pkg): Promise<Blob>`.
- `lib/reports/excel.ts` (replace) — `generateExcel(pkg): Promise<Blob>`.
- Tests under `__tests__/lib/reports/`.

---

### Task 1: Filing Package contract type + builder

**Files:** Create `lib/reports/filing-package.ts`; Test `__tests__/lib/reports/filing-package.test.ts`.

**Interfaces:** Produces `FILING_PACKAGE_VERSION = '1.0.0'`, the `FilingPackage` interface, and `buildFilingPackage(result: TaxResult, meta: { generatedAt: string }): FilingPackage`. The package embeds the whole `TaxResult` plus a stable summary block and version — the future full-1301 tool reads this.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/reports/filing-package.test.ts
import { describe, it, expect } from 'vitest'
import { buildFilingPackage, FILING_PACKAGE_VERSION } from '@/lib/reports/filing-package'
import type { TaxResult } from '@/lib/tax/types'

const result = {
  status: 'ok', taxYear: 2024,
  capitalGainLines: [], totalGainsIls: '12400', totalLossesIls: '0',
  currentLossUsedAgainstGainsIls: '0', currentLossUsedAgainstIncomeIls: '0',
  broughtForwardUsedIls: '0', carryForwardLossIls: '0',
  netCapitalGainIls: '12400', capitalGainsTaxIls: '3100',
  dividendLines: [], interestLines: [], dividendsTaxIls: '0', interestTaxIls: '0',
  countryCredits: [], totalCreditIls: '0', totalExcessCreditCarryForwardIls: '0',
  surtaxIls: '0', surtaxExplanation: null,
  totalTaxLiabilityIlsRounded: '3100',
  lossOffsetExplanation: { code: 'explain.lossOffset', params: {} },
  quarantined: [], exchangeRatesUsed: [],
} as TaxResult

describe('buildFilingPackage', () => {
  const pkg = buildFilingPackage(result, { generatedAt: '2026-08-01T00:00:00Z' })
  it('is versioned and JSON-serializable', () => {
    expect(pkg.schemaVersion).toBe(FILING_PACKAGE_VERSION)
    expect(() => JSON.parse(JSON.stringify(pkg))).not.toThrow()
  })
  it('carries the summary and full result', () => {
    expect(pkg.summary.totalTaxLiabilityIls).toBe('3100')
    expect(pkg.summary.netCapitalGainIls).toBe('12400')
    expect(pkg.result.taxYear).toBe(2024)
  })
})
```

- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement**

```ts
// lib/reports/filing-package.ts
import type { TaxResult } from '@/lib/tax/types'

export const FILING_PACKAGE_VERSION = '1.0.0'

export interface FilingPackageSummary {
  taxYear: number
  netCapitalGainIls: string
  capitalGainsTaxIls: string
  dividendsTaxIls: string
  interestTaxIls: string
  totalCreditIls: string
  surtaxIls: string
  totalTaxLiabilityIls: string
  carryForwardLossIls: string
  excessCreditCarryForwardIls: string
}

export interface FilingPackage {
  schemaVersion: string
  generatedAt: string
  summary: FilingPackageSummary
  result: TaxResult
}

export function buildFilingPackage(result: TaxResult, meta: { generatedAt: string }): FilingPackage {
  return {
    schemaVersion: FILING_PACKAGE_VERSION,
    generatedAt: meta.generatedAt,
    summary: {
      taxYear: result.taxYear,
      netCapitalGainIls: result.netCapitalGainIls,
      capitalGainsTaxIls: result.capitalGainsTaxIls,
      dividendsTaxIls: result.dividendsTaxIls,
      interestTaxIls: result.interestTaxIls,
      totalCreditIls: result.totalCreditIls,
      surtaxIls: result.surtaxIls,
      totalTaxLiabilityIls: result.totalTaxLiabilityIlsRounded,
      carryForwardLossIls: result.carryForwardLossIls,
      excessCreditCarryForwardIls: result.totalExcessCreditCarryForwardIls,
    },
    result,
  }
}
```

- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(reports): versioned Filing Package contract + builder"`

---

### Task 2: ITA field map

**Files:** Create `lib/reports/field-map.ts`; Test `__tests__/lib/reports/field-map.test.ts`.

**Interfaces:** Produces `interface MappedField { form: string; field: string; labelKey: string; valueIls: string }` and `mapToFields(result: TaxResult): MappedField[]`. Maps: net capital gain → 1322 (נספח ג׳) / 1325 (נספח ג(1)); foreign dividends + interest + foreign tax credit → 1324 (נספח ד׳); totals → 1301. **Form/field identifiers are data here and flagged for verification.**

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/reports/field-map.test.ts
import { describe, it, expect } from 'vitest'
import { mapToFields } from '@/lib/reports/field-map'
import type { TaxResult } from '@/lib/tax/types'

const result = { status: 'ok', taxYear: 2024, netCapitalGainIls: '12400',
  capitalGainsTaxIls: '3100', dividendsTaxIls: '0', interestTaxIls: '0',
  totalCreditIls: '0', surtaxIls: '0', totalTaxLiabilityIlsRounded: '3100',
  totalDividendsGrossIls: undefined } as unknown as TaxResult

describe('mapToFields', () => {
  const fields = mapToFields(result)
  it('maps net capital gain to form 1325 (נספח ג(1), no withholding)', () => {
    const f = fields.find(x => x.form === '1325')
    expect(f?.valueIls).toBe('12400')
  })
  it('includes the foreign-income appendix 1324', () => {
    expect(fields.some(x => x.form === '1324')).toBe(true)
  })
})
```

- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** (field numbers ◐ — confirm against each tax-year PDF)

```ts
// lib/reports/field-map.ts
import { add } from '@/lib/tax/decimal'
import type { TaxResult } from '@/lib/tax/types'

export interface MappedField { form: string; field: string; labelKey: string; valueIls: string }

// NOTE: `field` box numbers are placeholders pending verification against the
// per-tax-year ITA form PDFs (docs/tax-verification-checklist.md). Update here only.
export function mapToFields(result: TaxResult): MappedField[] {
  const dividendsGross = (result.dividendLines ?? []).reduce((s, l) => add(s, l.grossIls), '0')
  const interestGross = (result.interestLines ?? []).reduce((s, l) => add(s, l.grossIls), '0')
  return [
    { form: '1325', field: 'net-capital-gain', labelKey: 'field.capitalGain', valueIls: result.netCapitalGainIls },
    { form: '1322', field: 'capital-gains-tax', labelKey: 'field.capitalGainsTax', valueIls: result.capitalGainsTaxIls },
    { form: '1324', field: 'foreign-dividends', labelKey: 'field.foreignDividends', valueIls: dividendsGross },
    { form: '1324', field: 'foreign-interest', labelKey: 'field.foreignInterest', valueIls: interestGross },
    { form: '1324', field: 'foreign-tax-credit', labelKey: 'field.foreignTaxCredit', valueIls: result.totalCreditIls },
    { form: '1301', field: 'surtax', labelKey: 'field.surtax', valueIls: result.surtaxIls },
    { form: '1301', field: 'total-liability', labelKey: 'field.totalLiability', valueIls: result.totalTaxLiabilityIlsRounded },
  ]
}
```

- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(reports): ITA field map (1322/1325/1324/1301)"`

---

### Task 3: PDF export from the package

**Files:** Replace `lib/reports/pdf.ts`; Test `__tests__/lib/reports/pdf.test.ts`.

**Interfaces:** Produces `generatePdf(pkg: FilingPackage): Promise<Blob>` — renders the summary + field map + disclaimer; does not compute anything.

- [ ] **Step 1: Write the failing test** (assert it returns a non-empty Blob; jsPDF runs in jsdom)

```ts
// __tests__/lib/reports/pdf.test.ts
import { describe, it, expect } from 'vitest'
import { generatePdf } from '@/lib/reports/pdf'
import { buildFilingPackage } from '@/lib/reports/filing-package'
import type { TaxResult } from '@/lib/tax/types'

const result = { status: 'ok', taxYear: 2024, capitalGainLines: [], dividendLines: [], interestLines: [],
  netCapitalGainIls: '12400', capitalGainsTaxIls: '3100', dividendsTaxIls: '0', interestTaxIls: '0',
  totalCreditIls: '0', surtaxIls: '0', totalTaxLiabilityIlsRounded: '3100', countryCredits: [],
  totalExcessCreditCarryForwardIls: '0', carryForwardLossIls: '0', quarantined: [], exchangeRatesUsed: [],
  totalGainsIls: '12400', totalLossesIls: '0', currentLossUsedAgainstGainsIls: '0',
  currentLossUsedAgainstIncomeIls: '0', broughtForwardUsedIls: '0', surtaxExplanation: null,
  lossOffsetExplanation: { code: '', params: {} } } as TaxResult

describe('generatePdf', () => {
  it('produces a non-empty PDF blob', async () => {
    const blob = await generatePdf(buildFilingPackage(result, { generatedAt: '2026-08-01' }))
    expect(blob.size).toBeGreaterThan(0)
    expect(blob.type).toContain('pdf')
  })
})
```

- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement** (render summary + `mapToFields`, output blob)

```ts
// lib/reports/pdf.ts
import { jsPDF } from 'jspdf'
import { mapToFields } from './field-map'
import type { FilingPackage } from './filing-package'

export async function generatePdf(pkg: FilingPackage): Promise<Blob> {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(`IB-Taxil — Investment Portion ${pkg.summary.taxYear}`, 14, 18)
  doc.setFontSize(11)
  let y = 30
  const line = (k: string, v: string) => { doc.text(`${k}: ₪${v}`, 14, y); y += 8 }
  line('Net capital gain', pkg.summary.netCapitalGainIls)
  line('Capital gains tax', pkg.summary.capitalGainsTaxIls)
  line('Foreign tax credit', pkg.summary.totalCreditIls)
  line('Surtax', pkg.summary.surtaxIls)
  line('Total tax liability', pkg.summary.totalTaxLiabilityIls)
  y += 6; doc.text('ITA form fields:', 14, y); y += 8
  for (const f of mapToFields(pkg.result)) { doc.text(`${f.form} · ${f.field}: ₪${f.valueIls}`, 14, y); y += 7 }
  y += 6; doc.setFontSize(9)
  doc.text('Calculation aid only — verify with a licensed tax advisor before filing.', 14, y)
  return doc.output('blob')
}
```

- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(reports): PDF export from Filing Package"`

---

### Task 4: Excel export from the package

**Files:** Replace `lib/reports/excel.ts`; Test `__tests__/lib/reports/excel.test.ts`.

**Interfaces:** Produces `generateExcel(pkg: FilingPackage): Promise<Blob>` — sheets: Summary, Capital Gains, Dividends, Interest, Credits, Rates Used, Quarantined.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/lib/reports/excel.test.ts
import { describe, it, expect } from 'vitest'
import { generateExcel } from '@/lib/reports/excel'
import { buildFilingPackage } from '@/lib/reports/filing-package'
import type { TaxResult } from '@/lib/tax/types'

const result = { status: 'ok', taxYear: 2024, capitalGainLines: [], dividendLines: [], interestLines: [],
  netCapitalGainIls: '12400', capitalGainsTaxIls: '3100', dividendsTaxIls: '0', interestTaxIls: '0',
  totalCreditIls: '0', surtaxIls: '0', totalTaxLiabilityIlsRounded: '3100', countryCredits: [],
  totalExcessCreditCarryForwardIls: '0', carryForwardLossIls: '0', quarantined: [], exchangeRatesUsed: [],
  totalGainsIls: '12400', totalLossesIls: '0', currentLossUsedAgainstGainsIls: '0',
  currentLossUsedAgainstIncomeIls: '0', broughtForwardUsedIls: '0', surtaxExplanation: null,
  lossOffsetExplanation: { code: '', params: {} } } as TaxResult

describe('generateExcel', () => {
  it('produces a non-empty workbook blob', async () => {
    const blob = await generateExcel(buildFilingPackage(result, { generatedAt: '2026-08-01' }))
    expect(blob.size).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run** — Expected: FAIL.
- [ ] **Step 3: Implement**

```ts
// lib/reports/excel.ts
import ExcelJS from 'exceljs'
import type { FilingPackage } from './filing-package'

export async function generateExcel(pkg: FilingPackage): Promise<Blob> {
  const wb = new ExcelJS.Workbook()
  const s = wb.addWorksheet('Summary')
  s.addRows([
    ['Tax year', pkg.summary.taxYear],
    ['Net capital gain (₪)', pkg.summary.netCapitalGainIls],
    ['Capital gains tax (₪)', pkg.summary.capitalGainsTaxIls],
    ['Foreign tax credit (₪)', pkg.summary.totalCreditIls],
    ['Surtax (₪)', pkg.summary.surtaxIls],
    ['Total tax liability (₪)', pkg.summary.totalTaxLiabilityIls],
    ['Carry-forward loss (₪)', pkg.summary.carryForwardLossIls],
    ['Excess credit carry-forward (₪)', pkg.summary.excessCreditCarryForwardIls],
  ])
  const cg = wb.addWorksheet('Capital Gains')
  cg.addRow(['Ticker', 'Open date', 'Sale date', 'Open rate', 'Sale rate', 'Proceeds ₪', 'Cost ₪', 'Gain ₪'])
  pkg.result.capitalGainLines.forEach(l => cg.addRow([l.ticker, l.openDate, l.saleDate, l.openRate, l.saleRate, l.proceedsIls, l.costIls, l.gainIls]))
  const dv = wb.addWorksheet('Dividends')
  dv.addRow(['Ticker', 'Pay date', 'Gross ₪', 'Rate %', 'Israeli tax ₪', 'Credit ₪', 'Net tax ₪', 'Over-withheld ₪'])
  pkg.result.dividendLines.forEach(l => dv.addRow([l.ticker, l.payDate, l.grossIls, l.rate, l.israeliTaxIls, l.creditIls, l.netTaxIls, l.overWithheldIls]))
  const it = wb.addWorksheet('Interest')
  it.addRow(['Description', 'Pay date', 'Gross ₪', 'Israeli tax ₪', 'Credit ₪', 'Net tax ₪'])
  pkg.result.interestLines.forEach(l => it.addRow([l.description, l.payDate, l.grossIls, l.israeliTaxIls, l.creditIls, l.netTaxIls]))
  const rt = wb.addWorksheet('Rates Used')
  rt.addRow(['Currency', 'Date', 'Rate'])
  pkg.result.exchangeRatesUsed.forEach(r => rt.addRow([r.currency, r.date, r.rate]))
  const q = wb.addWorksheet('Quarantined')
  q.addRow(['Kind', 'Description'])
  pkg.result.quarantined.forEach(x => q.addRow([x.kind, x.description]))
  const buf = await wb.xlsx.writeBuffer()
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
```

- [ ] **Step 4: Run** — Expected: PASS. Run `npx vitest run __tests__/lib/reports`.
- [ ] **Step 5: Commit** `git commit -m "feat(reports): Excel export from Filing Package"`

## Self-Review
- ADR-0007 contract (versioned, JSON-serializable, UI-independent) → Task 1. Renderers read the package only. Field guide data → Task 2 (consumed by Plan E on-screen guide + PDF).
- **Verify gate:** ITA form/box numbers in `field-map.ts` (◐). Isolated as data.
- No placeholders; blobs asserted non-empty; line rendering iterates real result arrays.
