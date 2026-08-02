'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { IBKRData } from '@/lib/ibkr/types'

interface Props { data: IBKRData }

// Read-only preview of parsed records in their native currency. Shekel figures
// only appear after calculation (rates are fetched at the calculation gate).
export function TradeTable({ data }: Props) {
  const t = useTranslations('tradeTable')
  const [search, setSearch] = useState('')

  const matches = (ticker: string) =>
    !search || ticker.toLowerCase().includes(search.toLowerCase())

  const lots = data.closedLots.filter(l => matches(l.ticker))
  const income = [
    ...data.dividends.map(d => ({ id: d.id, ticker: d.ticker, date: d.payDate, kind: t('kindDividend'), amount: d.gross, currency: d.currency })),
    ...data.interest.map(i => ({ id: i.id, ticker: i.description, date: i.payDate, kind: t('kindInterest'), amount: i.gross, currency: i.currency })),
  ].filter(r => matches(r.ticker))

  return (
    <div className="space-y-6">
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
      />

      <div>
        <h4 className="text-xs font-semibold text-slate-500 mb-2">{t('closedLotsTitle')}</h4>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                {[t('colTicker'), t('colOpen'), t('colSale'), t('colProceeds'), t('colCost'), t('colCurrency')].map(h => (
                  <th key={h} className="px-4 py-2 text-start text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {lots.map(l => (
                <tr key={l.id}>
                  <td className="px-4 py-2 font-mono font-semibold text-slate-900 dark:text-white">{l.ticker}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{l.openDate}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{l.saleDate}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{l.proceeds}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{l.cost}</td>
                  <td className="px-4 py-2 text-slate-500">{l.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {lots.length === 0 && <p className="text-center py-6 text-slate-400 text-sm">{t('noRecords')}</p>}
        </div>
      </div>

      {income.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 mb-2">{t('incomeTitle')}</h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  {[t('colTicker'), t('colDate'), t('colType'), t('colAmount'), t('colCurrency')].map(h => (
                    <th key={h} className="px-4 py-2 text-start text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {income.map(r => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 font-mono font-semibold text-slate-900 dark:text-white">{r.ticker}</td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{r.date}</td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{r.kind}</td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{r.amount}</td>
                    <td className="px-4 py-2 text-slate-500">{r.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
