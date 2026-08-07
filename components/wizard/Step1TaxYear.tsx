'use client'

import { useTranslations } from 'next-intl'
import { selectableYears, isYearProvisional } from '@/lib/tax/rates'

interface Props {
  taxYear: number
  onTaxYearChange: (year: number) => void
  onNext: () => void
}

export function Step1TaxYear({ taxYear, onTaxYearChange, onNext }: Props) {
  const t = useTranslations('step1')
  const years = selectableYears()
  const anyProvisional = years.some(isYearProvisional)

  return (
    <div className="max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        {t('title')}
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
        {t('subtitle')}
      </p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {years.map(year => {
          const provisional = isYearProvisional(year)
          return (
            <button
              key={year}
              onClick={() => onTaxYearChange(year)}
              className={`relative py-4 rounded-xl text-lg font-semibold border-2 transition-all ${
                year === taxYear
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-300'
              }`}
            >
              {year}
              {provisional && (
                <span className="block text-[10px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
                  {t('provisionalBadge')}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {anyProvisional && (
        <p className="mb-8 text-xs text-amber-600 dark:text-amber-400">
          {t('provisionalNote')}
        </p>
      )}

      <div className="mb-6 p-3 bg-green-50 dark:bg-green-950 rounded-lg text-xs text-green-700 dark:text-green-300">
        🔒 {t('privacyNote')}
      </div>

      <button
        onClick={onNext}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {t('next')} →
      </button>
    </div>
  )
}
