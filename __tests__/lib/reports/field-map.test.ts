import { describe, it, expect } from 'vitest'
import { mapToFields } from '@/lib/reports/field-map'
import type { TaxResult } from '@/lib/tax/types'

const result = {
  status: 'ok', taxYear: 2024, netCapitalGainIls: '12400',
  capitalGainsTaxIls: '3100', dividendsTaxIls: '0', interestTaxIls: '0',
  totalCreditIls: '0', surtaxIls: '0', totalTaxLiabilityIlsRounded: '3100',
  dividendLines: [], interestLines: [],
} as unknown as TaxResult

describe('mapToFields', () => {
  const fields = mapToFields(result)
  it('maps net capital gain to form 1325 (נספח ג(1), no withholding)', () => {
    const f = fields.find(x => x.form === '1325')
    expect(f?.valueIls).toBe('12400')
  })
  it('includes the foreign-income appendix 1324', () => {
    expect(fields.some(x => x.form === '1324')).toBe(true)
  })
  it('rounds field values to whole shekels (חוק עיגול סכומים, half up)', () => {
    const fractional = {
      status: 'ok', taxYear: 2025,
      netCapitalGainIls: '2605.83054474', totalCreditIls: '1.50', surtaxIls: '0',
      totalTaxLiabilityIlsRounded: '657',
      capitalGainLines: [{ proceedsIls: '210238.460829128' }],
      dividendLines: [{ grossIls: '4.55598' }],
      interestLines: [{ grossIls: '22.06106' }],
    } as unknown as TaxResult
    const f = mapToFields(fractional)
    const val = (field: string) => f.find(x => x.field === field)?.valueIls
    expect(val('net-capital-gain')).toBe('2606')      // .83 rounds up
    expect(val('securities-turnover')).toBe('210238')  // .46 rounds down
    expect(val('foreign-dividends')).toBe('5')          // 4.56 → 5
    expect(val('foreign-income-total')).toBe('27')       // 26.617 → 27
    expect(val('foreign-tax-credit')).toBe('2')          // 1.50 → 2 (half up)
    // every value is an integer string (no agorot)
    for (const field of f) expect(field.valueIls).toMatch(/^-?\d+$/)
  })
})
