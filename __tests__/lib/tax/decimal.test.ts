import {
  add,
  sub,
  mul,
  div,
  pct,
  gt,
  lt,
  min,
  toIls,
  formatIls,
  abs,
  isZero,
  isNeg,
  zero,
} from '@/lib/tax/decimal'

describe('decimal helpers', () => {
  it('adds without floating point error', () => {
    expect(add('0.1', '0.2')).toBe('0.3')
  })

  it('subtracts', () => {
    expect(sub('1.00', '0.25')).toBe('0.75')
  })

  it('multiplies', () => {
    expect(mul('100.50', '3.6105')).toBe('362.85525')
  })

  it('divides', () => {
    expect(div('10', '4')).toBe('2.5')
  })

  it('calculates percentage', () => {
    expect(pct('1000', '25')).toBe('250')
  })

  it('min returns smaller value', () => {
    expect(min('100', '80')).toBe('80')
    expect(min('80', '100')).toBe('80')
  })

  it('toIls rounds to 2dp', () => {
    expect(toIls('123.456789')).toBe('123.46')
    expect(toIls('123.454')).toBe('123.45')
  })

  it('gt compares correctly', () => {
    expect(gt('10', '5')).toBe(true)
    expect(gt('5', '10')).toBe(false)
    expect(gt('5', '5')).toBe(false)
  })

  it('lt compares correctly', () => {
    expect(lt('5', '10')).toBe(true)
    expect(lt('10', '5')).toBe(false)
  })

  it('abs returns absolute value', () => {
    expect(abs('-50.5')).toBe('50.5')
    expect(abs('50.5')).toBe('50.5')
  })

  it('isZero identifies zero', () => {
    expect(isZero('0')).toBe(true)
    expect(isZero('0.00')).toBe(true)
    expect(isZero('0.001')).toBe(false)
  })

  it('isNeg identifies negative', () => {
    expect(isNeg('-1')).toBe(true)
    expect(isNeg('0')).toBe(false)
    expect(isNeg('1')).toBe(false)
  })

  it('zero constant is zero string', () => {
    expect(isZero(zero)).toBe(true)
  })

  it('formatIls formats with shekel symbol', () => {
    expect(formatIls('1234.5')).toContain('₪')
    expect(formatIls('1234.5')).toContain('1,234')
  })
})
