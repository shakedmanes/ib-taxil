'use client'

import { useTranslations } from 'next-intl'

interface Props {
  taxYear: number
  onTaxYearChange: (year: number) => void
  onNext: () => void
}

export function Step1TaxYear({ taxYear, onTaxYearChange, onNext }: Props) {
  const t = useTranslations('step1')
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 - i)

  return (
    <div className="max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        {t('title')}
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
        {t('subtitle')}
      </p>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {years.map(year => (
          <button
            key={year}
            onClick={() => onTaxYearChange(year)}
            className={`py-4 rounded-xl text-lg font-semibold border-2 transition-all ${
              year === taxYear
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-300'
            }`}
          >
            {year}
          </button>
        ))}
      </div>

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
