'use client'

import { useTranslations } from 'next-intl'
import { TaxSummaryHero } from '@/components/summary/TaxSummaryHero'
import { TaxBreakdown } from '@/components/summary/TaxBreakdown'
import { Explain } from '@/components/common/Explain'
import type { EngineOutput } from '@/lib/tax/types'

interface Props {
  output: EngineOutput
  onNext: () => void
  onBack: () => void
}

// Renders the engine's EngineOutput. Blocked results (ADR-0008) show fix-it
// guidance and NO numbers; OK results show explained totals and lines.
export function Step5Summary({ output, onNext, onBack }: Props) {
  const t = useTranslations('step5Summary')

  if (output.status === 'blocked') {
    return (
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{t('blockedTitle')}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{t('blockedSubtitle')}</p>

        <div className="space-y-3">
          {output.issues.map((issue, i) => (
            <div key={i} className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl">
              <Explain explanation={issue.explanation} />
            </div>
          ))}
        </div>

        <div className="flex justify-start mt-8">
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            {t('fixAndRetry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        {t('title', { year: output.taxYear })}
      </h2>

      <TaxSummaryHero result={output} />
      <TaxBreakdown result={output} />

      <div className="flex justify-between mt-8">
        <button onClick={onBack} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:underline">
          {t('back')}
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          {t('exportButton')}
        </button>
      </div>
    </div>
  )
}
