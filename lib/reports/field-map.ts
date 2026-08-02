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
