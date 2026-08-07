import { add, div, mul, gt, roundShekels } from '@/lib/tax/decimal'
import { itaFieldCode, type CodeStatus, type FieldKey } from './field-codes'
import type { TaxResult, DividendLine, InterestLine } from '@/lib/tax/types'

export interface MappedField {
  form: string
  code?: string        // the numbered ITA field, when known
  status?: CodeStatus  // verified / unverified for this year / system-computed
  field: string        // stable internal id
  labelKey: string
  valueIls: string     // whole shekels (חוק עיגול סכומים) — the value entered on the form
}

const sum = <T>(rows: T[], pick: (r: T) => string | undefined): string =>
  rows.reduce((s, r) => add(s, pick(r) ?? '0'), '0')

// Maps result values to named ITA fields. Field codes come from the per-year
// registry (lib/reports/field-codes.ts, sourced from the official form PDFs).
// Values are rounded to whole shekels here — the amount actually written in a
// numbered ITA box — while the engine keeps full precision internally (ADR-0009).
//
// Income and its foreign tax credit are split into the correct boxes by rate and
// basket: dividends 25% (141) vs 30% substantial-holder (055); FTC on נספח ד
// (1324) into dividend-25% (431), dividend-30% (413), and interest (417). The FTC
// boxes are scaled so they reconcile with the reported (loss-adjusted) total credit.
export function mapToFields(result: TaxResult): MappedField[] {
  const y = result.taxYear
  const f = (key: FieldKey) => itaFieldCode(key, y)
  const divs: DividendLine[] = result.dividendLines ?? []
  const ints: InterestLine[] = result.interestLines ?? []
  const is30 = (rate?: string) => rate === '30'
  const div25 = divs.filter(l => !is30(l.rate))
  const div30 = divs.filter(l => is30(l.rate))

  const div25Gross = sum(div25, l => l.grossIls)
  const div30Gross = sum(div30, l => l.grossIls)
  const interestGross = sum(ints, l => l.grossIls)
  const turnover = sum(result.capitalGainLines ?? [], l => l.proceedsIls)

  // Per-line credit split by rate/basket, scaled to the reported total credit.
  const div25Credit = sum(div25, l => l.creditIls)
  const div30Credit = sum(div30, l => l.creditIls)
  const interestCredit = sum(ints, l => l.creditIls)
  const rawCredit = add(add(div25Credit, div30Credit), interestCredit)
  const scale = rawCredit === '0' ? '0' : div(result.totalCreditIls, rawCredit)
  const credit = (raw: string) => roundShekels(mul(raw, scale))

  const fields: MappedField[] = [
    // Capital gains: per-lot detail on 1325, net gain by rate on 1322 (no single 1301 code).
    { form: '1325', status: f('capitalGainsDetail').status, field: 'net-capital-gain', labelKey: 'field.capitalGain', valueIls: roundShekels(result.netCapitalGainIls) },
    { form: '1301', code: f('capitalGainsTurnover').code, status: f('capitalGainsTurnover').status, field: 'securities-turnover', labelKey: 'field.turnover', valueIls: roundShekels(turnover) },
    { form: '1301', code: f('dividend25').code, status: f('dividend25').status, field: 'foreign-dividends', labelKey: 'field.foreignDividends', valueIls: roundShekels(div25Gross) },
  ]
  if (gt(div30Gross, '0')) {
    fields.push({ form: '1301', code: f('dividend30').code, status: f('dividend30').status, field: 'foreign-dividends-30', labelKey: 'field.foreignDividends30', valueIls: roundShekels(div30Gross) })
  }
  fields.push(
    { form: '1301', code: f('interest25').code, status: f('interest25').status, field: 'foreign-interest', labelKey: 'field.foreignInterest', valueIls: roundShekels(interestGross) },
    { form: '1301', code: f('foreignIncomeTotal').code, status: f('foreignIncomeTotal').status, field: 'foreign-income-total', labelKey: 'field.foreignIncomeTotal', valueIls: roundShekels(add(add(div25Gross, div30Gross), interestGross)) },
    { form: '1324', code: f('ftcDividendTax').code, status: f('ftcDividendTax').status, field: 'foreign-tax-credit', labelKey: 'field.foreignTaxCredit', valueIls: credit(div25Credit) },
  )
  if (gt(div30Credit, '0')) {
    fields.push({ form: '1324', code: f('ftcDividend30Tax').code, status: f('ftcDividend30Tax').status, field: 'foreign-tax-credit-30', labelKey: 'field.foreignTaxCredit30', valueIls: credit(div30Credit) })
  }
  if (gt(interestCredit, '0')) {
    fields.push({ form: '1324', code: f('ftcInterestTax').code, status: f('ftcInterestTax').status, field: 'foreign-tax-credit-interest', labelKey: 'field.foreignTaxCreditInterest', valueIls: credit(interestCredit) })
  }
  fields.push(
    { form: '1301', status: f('surtax').status, field: 'surtax', labelKey: 'field.surtax', valueIls: roundShekels(result.surtaxIls) },
    { form: '1301', field: 'total-liability', labelKey: 'field.totalLiability', valueIls: roundShekels(result.totalTaxLiabilityIlsRounded) },
  )
  return fields
}
