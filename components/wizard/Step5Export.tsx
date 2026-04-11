'use client'

import { ExportPanel } from '@/components/export/ExportPanel'
import type { TaxResult } from '@/lib/tax/types'

interface Props { result: TaxResult; taxYear: number }

export function Step5Export({ result, taxYear }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        Your {taxYear} Tax Reports
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Download your reports or use the on-screen guide to fill in the ITA portal.
      </p>
      <ExportPanel result={result} taxYear={taxYear} />
    </div>
  )
}
