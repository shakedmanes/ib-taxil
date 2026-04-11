'use client'

import { TaxSummaryHero } from '@/components/summary/TaxSummaryHero'
import { TaxBreakdown } from '@/components/summary/TaxBreakdown'
import type { TaxResult } from '@/lib/tax/types'

interface Props { result: TaxResult; taxYear: number; onNext: () => void }

export function Step4Summary({ result, taxYear, onNext }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        Tax Summary — {taxYear}
      </h2>

      <TaxSummaryHero result={result} taxYear={taxYear} />
      <TaxBreakdown result={result} />

      <button
        onClick={onNext}
        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Generate Reports →
      </button>
    </div>
  )
}
