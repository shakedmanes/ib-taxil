'use client'

import { formatIls } from '@/lib/tax/decimal'
import type { TaxResult } from '@/lib/tax/types'

interface Props { result: TaxResult; taxYear: number }

export function TaxSummaryHero({ result, taxYear }: Props) {
  return (
    <div className="bg-blue-50 dark:bg-blue-950 rounded-2xl p-6 mb-6 border border-blue-100 dark:border-blue-900">
      <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
        In <strong>{taxYear}</strong>, based on your IBKR data:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Net Capital Gain</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{formatIls(result.netCapitalGainIls)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Dividends Received</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{formatIls(result.totalDividendsIls)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
          <p className="text-xs text-slate-500 mb-1">Estimated Tax Liability</p>
          <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatIls(result.totalTaxLiabilityIls)}</p>
        </div>
      </div>

      <p className="text-sm text-blue-700 dark:text-blue-300">
        You realized <strong>{formatIls(result.netCapitalGainIls)}</strong> in capital gains and{' '}
        <strong>{formatIls(result.totalDividendsIls)}</strong> in dividends from your IBKR account.
        After applying <strong>{formatIls(result.totalForeignTaxCreditIls)}</strong> in foreign tax credits,
        your estimated Israeli tax liability is <strong>{formatIls(result.totalTaxLiabilityIls)}</strong>.
      </p>

      <p className="text-xs text-slate-400 mt-3">
        * This is a calculation aid. Please verify with a licensed tax advisor before filing.
      </p>
    </div>
  )
}
