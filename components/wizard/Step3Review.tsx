'use client'

import { useState } from 'react'
import { SummaryCards } from '@/components/review/SummaryCards'
import { TradeTable } from '@/components/review/TradeTable'
import { fetchBoiRates, buildRatesMap } from '@/lib/boi/rates'
import { calculateTax } from '@/lib/tax/calculator'
import type { IBKRData } from '@/lib/ibkr/types'
import type { TaxResult } from '@/lib/tax/types'

interface Props {
  data: IBKRData
  taxYear: number
  onResult: (result: TaxResult) => void
  onNext: () => void
}

export function Step3Review({ data, taxYear, onResult, onNext }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = async () => {
    setLoading(true)
    setError(null)
    try {
      const rates = await fetchBoiRates(taxYear)
      const ratesMap = buildRatesMap(rates)
      const result = calculateTax(data, ratesMap, taxYear)
      onResult(result)
      onNext()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Calculation failed.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
        Review Your {taxYear} Data
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        {data.trades.length} trades · {data.dividends.length} dividends · Account {data.accountId}
      </p>

      <SummaryCards data={data} />
      <TradeTable data={data} />

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <button
        onClick={handleCalculate}
        disabled={loading}
        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? 'Fetching BOI rates & calculating…' : 'Calculate My Tax →'}
      </button>
    </div>
  )
}
