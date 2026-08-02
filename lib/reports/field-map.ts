import { add } from '@/lib/tax/decimal'
import { itaFieldCode, type CodeStatus, type FieldKey } from './field-codes'
import type { TaxResult } from '@/lib/tax/types'

export interface MappedField {
  form: string
  code?: string        // the numbered ITA field, when known
  status?: CodeStatus  // verified / unverified for this year / system-computed
  field: string        // stable internal id
  labelKey: string
  valueIls: string
}

// Maps result values to named ITA fields. Field codes come from the per-year
// registry (lib/reports/field-codes.ts, sourced from the official form PDFs).
export function mapToFields(result: TaxResult): MappedField[] {
  const y = result.taxYear
  const f = (key: FieldKey) => itaFieldCode(key, y)
  const dividendsGross = (result.dividendLines ?? []).reduce((s, l) => add(s, l.grossIls), '0')
  const interestGross = (result.interestLines ?? []).reduce((s, l) => add(s, l.grossIls), '0')
  const turnover = (result.capitalGainLines ?? []).reduce((s, l) => add(s, l.proceedsIls), '0')

  return [
    // Capital gains: per-lot detail on 1325, net gain by rate on 1322 (no single 1301 code).
    { form: '1325', status: f('capitalGainsDetail').status, field: 'net-capital-gain', labelKey: 'field.capitalGain', valueIls: result.netCapitalGainIls },
    { form: '1301', code: f('capitalGainsTurnover').code, status: f('capitalGainsTurnover').status, field: 'securities-turnover', labelKey: 'field.turnover', valueIls: turnover },
    { form: '1301', code: f('dividend25').code, status: f('dividend25').status, field: 'foreign-dividends', labelKey: 'field.foreignDividends', valueIls: dividendsGross },
    { form: '1301', code: f('interest25').code, status: f('interest25').status, field: 'foreign-interest', labelKey: 'field.foreignInterest', valueIls: interestGross },
    { form: '1301', code: f('foreignIncomeTotal').code, status: f('foreignIncomeTotal').status, field: 'foreign-income-total', labelKey: 'field.foreignIncomeTotal', valueIls: add(dividendsGross, interestGross) },
    { form: '1324', code: f('ftcDividendTax').code, status: f('ftcDividendTax').status, field: 'foreign-tax-credit', labelKey: 'field.foreignTaxCredit', valueIls: result.totalCreditIls },
    { form: '1301', status: f('surtax').status, field: 'surtax', labelKey: 'field.surtax', valueIls: result.surtaxIls },
    { form: '1301', field: 'total-liability', labelKey: 'field.totalLiability', valueIls: result.totalTaxLiabilityIlsRounded },
  ]
}
