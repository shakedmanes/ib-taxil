import { describe, it, expect } from 'vitest'
import { dataflowFor, SUPPORTED_CURRENCIES } from '@/lib/boi/dataflow'

describe('dataflowFor', () => {
  it('maps USD/EUR/GBP to their SDMX dataflows', () => {
    expect(dataflowFor('USD')).toContain('RER_USD_ILS')
    expect(dataflowFor('EUR')).toContain('RER_EUR_ILS')
    expect(dataflowFor('GBP')).toContain('RER_GBP_ILS')
  })
  it('places the version before the series key (SDMX v2 data path)', () => {
    // BOI.STATISTICS/EXR/1.0/RER_USD_ILS — verified working against edge.boi.gov.il
    expect(dataflowFor('USD')).toBe('BOI.STATISTICS/EXR/1.0/RER_USD_ILS')
  })
  it('lists supported currencies and throws for others', () => {
    expect(SUPPORTED_CURRENCIES).toContain('USD')
    expect(() => dataflowFor('XYZ')).toThrow(/unsupported/i)
  })
})
