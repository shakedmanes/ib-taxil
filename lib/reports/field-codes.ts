// ITA (Israel Tax Authority) numbered field codes for the investment portion,
// keyed by semantic meaning. Sourced from the official gov.il form PDFs and
// cross-verified between form 1301 and נספח ד (1324) — see docs/ita-field-codes.md.
//
// The codes have been stable across years; they are VERIFIED against the 2024
// and 2025 forms. For any other year they are returned as `unverified` so the
// UI prompts the filer to confirm against that year's form.

export type CodeStatus = 'verified' | 'unverified' | 'system'

export interface ItaFieldCode {
  form: string        // '1301', '1324', '1325/1322', …
  code?: string       // the numbered field, when the value has a dedicated box
  status: CodeStatus  // verified for this year / unverified for this year / system-computed
}

export type FieldKey =
  | 'capitalGainsDetail'    // per-lot detail: 1325 (נספח ג(1)); net gain by rate: 1322 (נספח ג)
  | 'capitalGainsTurnover'  // total securities proceeds → 1301 field 256
  | 'dividend25'            // foreign dividend 25% → 1301 field 141
  | 'dividend30'            // substantial-holder dividend 30% → 1301 field 055
  | 'interest25'            // foreign interest 25% → 1301 field 157
  | 'foreignIncomeTotal'    // total foreign income → 1301 field 290 (attach נספח ד)
  | 'ftcDividendTax'        // foreign tax on dividends → נספח ד box 431 (25%)
  | 'ftcDividend30Tax'      // foreign tax on 30% dividends → נספח ד box 413
  | 'ftcInterestTax'        // foreign tax on interest → נספח ד box 417
  | 'ftcCapitalGainsTax'    // foreign tax on securities capital gains → נספח ד box 422
  | 'surtax'                // מס יסף §121ב — computed by the ITA system, no filer field

const CODES: Record<FieldKey, ItaFieldCode> = {
  capitalGainsDetail:   { form: '1325/1322', status: 'verified' },
  capitalGainsTurnover: { form: '1301', code: '256', status: 'verified' },
  dividend25:           { form: '1301', code: '141', status: 'verified' },
  dividend30:           { form: '1301', code: '055', status: 'verified' },
  interest25:           { form: '1301', code: '157', status: 'verified' },
  foreignIncomeTotal:   { form: '1301', code: '290', status: 'verified' },
  ftcDividendTax:       { form: '1324', code: '431', status: 'verified' },
  ftcDividend30Tax:     { form: '1324', code: '413', status: 'verified' },
  ftcInterestTax:       { form: '1324', code: '417', status: 'verified' },
  ftcCapitalGainsTax:   { form: '1324', code: '422', status: 'verified' },
  surtax:               { form: '1301', status: 'system' },
}

// Tax years whose forms were read and confirmed field-by-field.
const VERIFIED_YEARS = new Set<number>([2024, 2025])

/**
 * Field code for a semantic key and tax year. The code itself is the same across
 * years (historically stable); `status` reflects whether it was verified for the
 * requested year, so the UI can flag "confirm for {year}" on unverified years.
 */
export function itaFieldCode(key: FieldKey, year: number): ItaFieldCode {
  const base = CODES[key]
  if (base.status === 'system') return base
  return { ...base, status: VERIFIED_YEARS.has(year) ? 'verified' : 'unverified' }
}

export function isYearVerified(year: number): boolean {
  return VERIFIED_YEARS.has(year)
}
