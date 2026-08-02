'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { formatIls, gt } from '@/lib/tax/decimal'
import { Explain } from '@/components/common/Explain'
import type { TaxResult } from '@/lib/tax/types'

interface Props { result: TaxResult }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-5 py-4 bg-white dark:bg-slate-900 text-start font-semibold text-slate-900 dark:text-white text-sm"
      >
        {title}
        <span className="text-slate-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-5 pb-4 bg-white dark:bg-slate-900 space-y-3">{children}</div>}
    </div>
  )
}

// Every line carries its own domain Explanation, rendered via <Explain>.
export function TaxBreakdown({ result }: Props) {
  const t = useTranslations('taxBreakdown')

  return (
    <div>
      <Section title={t('capitalGainsTitle', { amount: formatIls(result.capitalGainsTaxIls) })}>
        {result.capitalGainLines.length === 0 && <p className="text-sm text-slate-400">{t('none')}</p>}
        {result.capitalGainLines.map((l, i) => (
          <div key={i} className="border-t border-slate-100 dark:border-slate-800 pt-3 first:border-0 first:pt-0">
            <div className="flex justify-between text-sm">
              <span className="font-mono font-semibold text-slate-900 dark:text-white">{l.ticker}</span>
              <span className={gt(l.gainIls, '0') ? 'text-green-600' : 'text-red-600'}>{formatIls(l.gainIls)}</span>
            </div>
            <Explain explanation={l.explanation} />
          </div>
        ))}
        <p className="text-xs text-slate-400">{t('lossOffsetNote')}</p>
        <Explain explanation={result.lossOffsetExplanation} />
      </Section>

      <Section title={t('dividendsTitle', { amount: formatIls(result.dividendsTaxIls) })}>
        {result.dividendLines.length === 0 && <p className="text-sm text-slate-400">{t('none')}</p>}
        {result.dividendLines.map((l, i) => (
          <div key={i} className="border-t border-slate-100 dark:border-slate-800 pt-3 first:border-0 first:pt-0">
            <div className="flex justify-between text-sm">
              <span className="font-mono font-semibold text-slate-900 dark:text-white">{l.ticker}</span>
              <span className="text-slate-900 dark:text-white">{formatIls(l.netTaxIls)}</span>
            </div>
            <Explain explanation={l.explanation} />
            {gt(l.overWithheldIls, '0') && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {t('overWithheldFlag', { amount: formatIls(l.overWithheldIls) })}
              </p>
            )}
          </div>
        ))}
      </Section>

      <Section title={t('interestTitle', { amount: formatIls(result.interestTaxIls) })}>
        {result.interestLines.length === 0 && <p className="text-sm text-slate-400">{t('none')}</p>}
        {result.interestLines.map((l, i) => (
          <div key={i} className="border-t border-slate-100 dark:border-slate-800 pt-3 first:border-0 first:pt-0">
            <Explain explanation={l.explanation} />
          </div>
        ))}
      </Section>

      {result.countryCredits.length > 0 && (
        <Section title={t('creditsTitle', { amount: formatIls(result.totalCreditIls) })}>
          {result.countryCredits.map((c, i) => (
            <div key={i} className="border-t border-slate-100 dark:border-slate-800 pt-3 first:border-0 first:pt-0">
              <Explain explanation={c.explanation} />
            </div>
          ))}
        </Section>
      )}

      <Section title={t('carryForwardTitle')}>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {t('carryForwardLoss', { amount: formatIls(result.carryForwardLossIls) })}
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {t('excessCredit', { amount: formatIls(result.totalExcessCreditCarryForwardIls) })}
        </p>
      </Section>

      <Section title={t('exchangeRatesTitle')}>
        <table className="w-full text-xs mt-2">
          <thead>
            <tr className="text-slate-400">
              <th className="text-start pb-2">{t('colCurrency')}</th>
              <th className="text-start pb-2">{t('colDate')}</th>
              <th className="text-end pb-2">{t('colRate')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {result.exchangeRatesUsed.map((r, i) => (
              <tr key={i}>
                <td className="py-2 text-slate-500">{r.currency}</td>
                <td className="py-2 text-slate-500">{r.date}</td>
                <td className="py-2 text-end font-mono">{r.rate}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-slate-400 mt-2">{t('exchangeRatesSource')}</p>
      </Section>
    </div>
  )
}
