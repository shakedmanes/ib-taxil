import Decimal from 'decimal.js'

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

export const add = (a: string, b: string): string =>
  new Decimal(a).plus(b).toString()

export const sub = (a: string, b: string): string =>
  new Decimal(a).minus(b).toString()

export const mul = (a: string, b: string): string =>
  new Decimal(a).times(b).toString()

export const div = (a: string, b: string): string =>
  new Decimal(a).dividedBy(b).toString()

export const pct = (amount: string, rate: string): string =>
  new Decimal(amount).times(new Decimal(rate).dividedBy(100)).toString()

export const gt = (a: string, b: string): boolean => new Decimal(a).gt(b)

export const lt = (a: string, b: string): boolean => new Decimal(a).lt(b)

export const gte = (a: string, b: string): boolean => new Decimal(a).gte(b)

export const lte = (a: string, b: string): boolean => new Decimal(a).lte(b)

export const min = (a: string, b: string): string =>
  new Decimal(a).lt(b) ? a : b

export const max = (a: string, b: string): string =>
  new Decimal(a).gt(b) ? a : b

export const abs = (a: string): string => new Decimal(a).abs().toString()

export const neg = (a: string): string => new Decimal(a).negated().toString()

export const zero = '0'

export const isZero = (a: string): boolean => new Decimal(a).isZero()

export const isNeg = (a: string): boolean => new Decimal(a).isNegative()

/** Round to 2 decimal places for ILS display */
export const toIls = (a: string): string =>
  new Decimal(a).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2)

/** Format for display: ₪1,234.56 */
export const formatIls = (a: string): string =>
  `₪${Number(toIls(a)).toLocaleString('he-IL', { minimumFractionDigits: 2 })}`

/**
 * Output rounding (ADR-0009): nearest whole shekel, half rounded up.
 * decimal.js ROUND_HALF_UP rounds .5 away from zero; Israeli חוק עיגול סכומים
 * rounds a half toward positive infinity, so use ROUND_HALF_CEIL.
 */
export const roundShekels = (a: string): string =>
  new Decimal(a).toDecimalPlaces(0, Decimal.ROUND_HALF_CEIL).toFixed(0)

/**
 * Format a value that is entered in a numbered ITA form field: whole shekels
 * (חוק עיגול סכומים, nearest/half-up), no agorot — e.g. ₪1,235. Use this for
 * form-box entries; use {@link formatIls} for supporting/worksheet detail.
 */
export const formatShekels = (a: string): string =>
  `₪${Number(roundShekels(a)).toLocaleString('he-IL')}`
