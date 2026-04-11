'use client'

import { useState } from 'react'
import { parseFlexXml } from '@/lib/ibkr/parser-xml'
import type { IBKRData } from '@/lib/ibkr/types'

const PROXY_BASE = process.env.NEXT_PUBLIC_PROXY_URL ?? 'https://ibkr-proxy.your-worker.workers.dev'

interface Props {
  taxYear: number
  onData: (data: IBKRData) => void
  onError: (msg: string) => void
}

export function IBKRApiCard({ taxYear, onData, onError }: Props) {
  const [token, setToken] = useState('')
  const [queryId, setQueryId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFetch = async () => {
    if (!token.trim() || !queryId.trim()) {
      onError('Please enter both your Flex Query token and Query ID.')
      return
    }
    setLoading(true)
    try {
      // Phase 1: get reference code
      const sendRes = await fetch(`${PROXY_BASE}?action=send&t=${encodeURIComponent(token)}&q=${encodeURIComponent(queryId)}`)
      if (!sendRes.ok) throw new Error(`IBKR proxy returned ${sendRes.status}. Please try again.`)
      const sendXml = await sendRes.text()
      const refMatch = sendXml.match(/<ReferenceCode>(.*?)<\/ReferenceCode>/)
      if (!refMatch) throw new Error('Could not get reference code from IBKR. Check your token and Query ID.')

      // Small delay IBKR requires before fetching
      await new Promise(r => setTimeout(r, 2000))

      // Phase 2: fetch report using reference code
      const getRes = await fetch(`${PROXY_BASE}?action=get&q=${encodeURIComponent(refMatch[1])}`)
      if (!getRes.ok) throw new Error(`IBKR proxy returned ${getRes.status} when fetching report. Please try again.`)
      const xml = await getRes.text()

      const data = parseFlexXml(xml)
      // Clear token from memory immediately
      setToken('')
      onData(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data from IBKR.'
      onError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-2 border-blue-500 rounded-2xl p-6 bg-blue-50 dark:bg-blue-950">
      <div className="text-3xl mb-3">🔗</div>
      <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-1">Connect via IBKR API</h3>
      <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
        Enter your Flex Query token — we'll fetch your {taxYear} data automatically.
      </p>

      <div className="space-y-3">
        <div>
          <label htmlFor="flex-token" className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
            Flex Query Token
          </label>
          <input
            id="flex-token"
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Paste your token here"
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="flex-query-id" className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
            Query ID
          </label>
          <input
            id="flex-query-id"
            type="text"
            value={queryId}
            onChange={e => setQueryId(e.target.value)}
            placeholder="e.g. 123456"
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <details className="mt-3 text-xs text-blue-700 dark:text-blue-300">
        <summary className="cursor-pointer hover:underline">How to get your Flex Query token →</summary>
        <ol className="mt-2 list-decimal list-inside space-y-1 pl-1">
          <li>Log in to IBKR Client Portal</li>
          <li>Go to Reports → Flex Queries</li>
          <li>Create a new Activity Flex Query for {taxYear}</li>
          <li>Enable: Trades, Cash Transactions (Dividends + Withholding Tax)</li>
          <li>Set format to XML</li>
          <li>Copy the Token and Query ID shown after saving</li>
        </ol>
      </details>

      <button
        onClick={handleFetch}
        disabled={loading}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
      >
        {loading ? 'Fetching…' : 'Fetch My Data →'}
      </button>
    </div>
  )
}
