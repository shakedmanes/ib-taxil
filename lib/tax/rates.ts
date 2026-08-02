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

export const RATE_TABLE: Record<number, YearRates> = {
  2022: { capitalGainsRate: '25', substantialHolderRate: '30', dividendRate: '25', interestRate: '25', surtaxThresholdIls: '663240', surtaxBaseRate: '3', capitalSurtaxRate: '0' },
  2023: { capitalGainsRate: '25', substantialHolderRate: '30', dividendRate: '25', interestRate: '25', surtaxThresholdIls: '698280', surtaxBaseRate: '3', capitalSurtaxRate: '0' },
  2024: { capitalGainsRate: '25', substantialHolderRate: '30', dividendRate: '25', interestRate: '25', surtaxThresholdIls: '721560', surtaxBaseRate: '3', capitalSurtaxRate: '0' },
  2025: { capitalGainsRate: '25', substantialHolderRate: '30', dividendRate: '25', interestRate: '25', surtaxThresholdIls: '721560', surtaxBaseRate: '3', capitalSurtaxRate: '2' },
}

export const SUPPORTED_YEARS: number[] = Object.keys(RATE_TABLE).map(Number).sort((a, b) => a - b)

export function getYearRates(year: number): YearRates {
  const row = RATE_TABLE[year]
  if (!row) throw new Error(`Tax year ${year} is not supported (supported: ${SUPPORTED_YEARS.join(', ')})`)
  return row
}
