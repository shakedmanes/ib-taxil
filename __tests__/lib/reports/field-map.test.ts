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
})
