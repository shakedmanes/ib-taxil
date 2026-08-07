/**
 * Verified Israeli tax constants per tax year.
 * Source: docs/tax-research-findings.md (researched 2026-08-01).
 * §91b capital gains, §125ב dividends, §125ג interest, §121ב surtax,
 * 2025 Arrangements Law (Amendment 276) capital surtax.
 * Adding a future year = add one verified row here.
 */
export interface YearRates {
  capitalGainsRate: string
  substantialHolderRate: string
  dividendRate: string
  interestRate: string
  surtaxThresholdIls: string
  surtaxBaseRate: string
  capitalSurtaxRate: string // 0 before 2025, 2 from 2025
}

// Officially-confirmed years: each row is read from that year's published ITA
// constants. Adding a future year = add one verified row here (see CONTRIBUTING).
export const RATE_TABLE: Record<number, YearRates> = {
  2024: { capitalGainsRate: '25', substantialHolderRate: '30', dividendRate: '25', interestRate: '25', surtaxThresholdIls: '721560', surtaxBaseRate: '3', capitalSurtaxRate: '0' },
  2025: { capitalGainsRate: '25', substantialHolderRate: '30', dividendRate: '25', interestRate: '25', surtaxThresholdIls: '721560', surtaxBaseRate: '3', capitalSurtaxRate: '2' },
}

/** Officially-confirmed years, ascending. */
export const SUPPORTED_YEARS: number[] = Object.keys(RATE_TABLE).map(Number).sort((a, b) => a - b)
/** Earliest year the engine will compute. Years before this are hard-blocked. */
export const MIN_SUPPORTED_YEAR = SUPPORTED_YEARS[0]
/** Most recent year with officially-confirmed constants. */
export const LATEST_KNOWN_YEAR = SUPPORTED_YEARS[SUPPORTED_YEARS.length - 1]

/**
 * A year beyond the latest confirmed year is computed *provisionally*: the engine
 * carries the latest known constants forward so a new filing season works on day
 * one, but the surtax threshold (inflation-indexed) and any law change for that
 * year are not yet reflected. Such results MUST be flagged for confirmation.
 */
export function isYearProvisional(year: number): boolean {
  return year > LATEST_KNOWN_YEAR
}

export function getYearRates(year: number): YearRates {
  const row = RATE_TABLE[year]
  if (row) return { ...row }
  // Forward-carry the latest confirmed constants for future (provisional) years.
  if (year > LATEST_KNOWN_YEAR) return { ...RATE_TABLE[LATEST_KNOWN_YEAR] }
  throw new Error(`Tax year ${year} is not supported (earliest supported: ${MIN_SUPPORTED_YEAR})`)
}

/**
 * Years a filer may select, newest first: from the earliest supported year up to
 * the most recent filing year (last completed calendar year). Never offers a year
 * the engine would hard-block. Years past {@link LATEST_KNOWN_YEAR} are provisional.
 */
export function selectableYears(today: Date = new Date()): number[] {
  const top = Math.max(LATEST_KNOWN_YEAR, today.getFullYear() - 1)
  const years: number[] = []
  for (let y = top; y >= MIN_SUPPORTED_YEAR; y--) years.push(y)
  return years
}
