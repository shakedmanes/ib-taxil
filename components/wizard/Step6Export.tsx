'use client'

import { useTranslations } from 'next-intl'
import { ExportPanel } from '@/components/export/ExportPanel'
import type { TaxResult } from '@/lib/tax/types'

interface Props { result: TaxResult; onBack: () => void }

export function Step6Export({ result, onBack }: Props) {
  const t = useTranslations('step6Export')

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        {t('title', { year: result.taxYear })}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{t('subtitle')}</p>

      <ExportPanel result={result} />

      <div className="flex justify-start mt-8">
        <button onClick={onBack} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:underline">
          {t('back')}
        </button>
      </div>
    </div>
  )
}
