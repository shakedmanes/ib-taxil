'use client'

import { useTranslations } from 'next-intl'
import { ExportPanel } from '@/components/export/ExportPanel'
import type { TaxResult } from '@/lib/tax/types'

interface Props { result: TaxResult; onBack: () => void; onNext: () => void }

export function Step6Export({ result, onBack, onNext }: Props) {
  const t = useTranslations('step6Export')

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        {t('title', { year: result.taxYear })}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{t('subtitle')}</p>

      <ExportPanel result={result} />

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-blue-900 dark:text-blue-200 text-sm">{t('walkthroughTitle')}</p>
          <p className="text-xs text-blue-700 dark:text-blue-300">{t('walkthroughSubtitle')}</p>
        </div>
        <button
          onClick={onNext}
          className="flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          {t('walkthroughCta')}
        </button>
      </div>

      <div className="flex justify-start mt-6">
        <button onClick={onBack} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:underline">
          {t('back')}
        </button>
      </div>
    </div>
  )
}
