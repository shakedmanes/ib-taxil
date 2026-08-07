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
      dividendLines: [{ grossIls: '4.55598', rate: '25', creditIls: '1.50' }],
      interestLines: [{ grossIls: '22.06106', creditIls: '0' }],
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

  it('routes each income/credit to its correct ITA box by rate and basket', () => {
    const mixed = {
      status: 'ok', taxYear: 2025,
      netCapitalGainIls: '0', surtaxIls: '0', totalTaxLiabilityIlsRounded: '0',
      totalCreditIls: '30', // 10 (div25) + 8 (div30) + 12 (interest)
      capitalGainLines: [],
      dividendLines: [
        { grossIls: '100', rate: '25', creditIls: '10' },
        { grossIls: '80', rate: '30', creditIls: '8' },
      ],
      interestLines: [{ grossIls: '60', rate: '25', creditIls: '12' }],
    } as unknown as TaxResult
    const f = mapToFields(mixed)
    const box = (field: string) => f.find(x => x.field === field)
    // gross income boxes
    expect(box('foreign-dividends')).toMatchObject({ code: '141', valueIls: '100' })
    expect(box('foreign-dividends-30')).toMatchObject({ code: '055', valueIls: '80' })
    expect(box('foreign-interest')).toMatchObject({ code: '157', valueIls: '60' })
    // FTC boxes on נספח ד (1324), no longer collapsed into 431
    expect(box('foreign-tax-credit')).toMatchObject({ form: '1324', code: '431', valueIls: '10' })
    expect(box('foreign-tax-credit-30')).toMatchObject({ form: '1324', code: '413', valueIls: '8' })
    expect(box('foreign-tax-credit-interest')).toMatchObject({ form: '1324', code: '417', valueIls: '12' })
  })

  it('omits rate/basket boxes that do not apply (no 30% or interest credit)', () => {
    const simple = {
      status: 'ok', taxYear: 2025,
      netCapitalGainIls: '0', surtaxIls: '0', totalTaxLiabilityIlsRounded: '0',
      totalCreditIls: '10',
      capitalGainLines: [],
      dividendLines: [{ grossIls: '100', rate: '25', creditIls: '10' }],
      interestLines: [],
    } as unknown as TaxResult
    const f = mapToFields(simple)
    expect(f.some(x => x.field === 'foreign-dividends-30')).toBe(false)
    expect(f.some(x => x.field === 'foreign-tax-credit-interest')).toBe(false)
    expect(f.find(x => x.field === 'foreign-tax-credit')?.valueIls).toBe('10')
  })
})
