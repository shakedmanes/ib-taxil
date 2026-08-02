'use client'

import { useTranslations } from 'next-intl'
import { SummaryCards } from '@/components/review/SummaryCards'
import { TradeTable } from '@/components/review/TradeTable'
import type { IBKRData } from '@/lib/ibkr/types'

interface Props {
  data: IBKRData
  taxYear: number
  substantialHoldings: string[]
  onToggleSubstantial: (ticker: string) => void
  onNext: () => void
  onBack: () => void
}

// Review parsed data. The engine runs later (at the calculation gate), so this
// step only previews records, marks which fall in the chosen tax year, lists
// quarantined out-of-scope items (ADR-0008), and lets the user flag substantial
// holdings (30% rate, ADR-0006).
export function Step3Review({ data, taxYear, substantialHoldings, onToggleSubstantial, onNext, onBack }: Props) {
  const t = useTranslations('step3Review')

  const holdingTickers = [...new Set([
    ...data.closedLots.map(l => l.ticker),
    ...data.dividends.map(d => d.ticker),
  ])].sort()

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
        {t('title')}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        {t('subtitle', {
          lots: data.closedLots.length,
          dividends: data.dividends.length,
          interest: data.interest.length,
          account: data.accountId,
        })}
      </p>

      <SummaryCards data={data} taxYear={taxYear} />
      <TradeTable data={data} taxYear={taxYear} />

      {holdingTickers.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">{t('substantialTitle')}</h3>
          <p className="text-xs text-slate-500 mb-3">{t('substantialHelp')}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {holdingTickers.map(ticker => (
              <label key={ticker} className="flex items-center gap-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                <input
                  type="checkbox"
                  checked={substantialHoldings.includes(ticker)}
                  onChange={() => onToggleSubstantial(ticker)}
                  aria-label={t('substantialLabel', { ticker })}
                />
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{ticker}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {data.outOfScope.length > 0 && (
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl">
          <h3 className="font-semibold text-amber-800 dark:text-amber-200 text-sm mb-1">{t('quarantineTitle')}</h3>
          <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">{t('quarantineHelp')}</p>
          <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-200">
            {data.outOfScope.map(o => (
              <li key={o.id}>• {o.description} <span className="text-xs text-amber-600 dark:text-amber-400">({o.kind})</span></li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button onClick={onBack} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:underline">
          {t('back')}
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          {t('next')}
        </button>
      </div>
    </div>
  )
}
