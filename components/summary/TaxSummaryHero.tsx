'use client'

import { useTranslations } from 'next-intl'
import { formatIls } from '@/lib/tax/decimal'
import type { TaxResult } from '@/lib/tax/types'

interface Props { result: TaxResult }

// Headline totals for an OK result. All figures come pre-computed from the
// engine (ADR-0005/0009) — this only formats and labels them.
export function TaxSummaryHero({ result }: Props) {
  const t = useTranslations('taxHero')

  const stats = [
    { label: t('netCapitalGain'), value: formatIls(result.netCapitalGainIls) },
    { label: t('capitalGainsTax'), value: formatIls(result.capitalGainsTaxIls) },
    { label: t('dividendsTax'), value: formatIls(result.dividendsTaxIls) },
    { label: t('interestTax'), value: formatIls(result.interestTaxIls) },
    { label: t('foreignTaxCredit'), value: formatIls(result.totalCreditIls) },
    { label: t('surtax'), value: formatIls(result.surtaxIls) },
  ]

  return (
    <div className="bg-blue-50 dark:bg-blue-950 rounded-2xl p-6 mb-6 border border-blue-100 dark:border-blue-900">
      <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
        {t('intro', { year: result.taxYear })}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
        <p className="text-xs text-slate-500 mb-1">{t('taxLiability')}</p>
        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
          {formatIls(result.totalTaxLiabilityIlsRounded)}
        </p>
      </div>

      <p className="text-xs text-slate-400 mt-3">{t('disclaimer')}</p>
    </div>
  )
}
