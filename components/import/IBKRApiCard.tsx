'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { parseFlexXml } from '@/lib/ibkr/parser-xml'
import type { IBKRData } from '@/lib/ibkr/types'

const PROXY_BASE = process.env.NEXT_PUBLIC_PROXY_URL ?? 'https://ibkr-proxy.your-worker.workers.dev'

interface Props {
  taxYear: number
  onData: (data: IBKRData) => void
  onError: (msg: string) => void
}

export function IBKRApiCard({ taxYear, onData, onError }: Props) {
  const t = useTranslations('ibkrApi')
  const [token, setToken] = useState('')
  const [queryId, setQueryId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFetch = async () => {
    if (!token.trim() || !queryId.trim()) {
      onError(t('errorMissingFields'))
      return
    }
    setLoading(true)
    try {
      // Phase 1: get reference code
      const sendRes = await fetch(`${PROXY_BASE}?action=send&t=${encodeURIComponent(token)}&q=${encodeURIComponent(queryId)}`)
      if (!sendRes.ok) throw new Error(t('errorProxy', { status: sendRes.status }))
      const sendXml = await sendRes.text()
      const refMatch = sendXml.match(/<ReferenceCode>(.*?)<\/ReferenceCode>/)
      if (!refMatch) throw new Error(t('errorNoRefCode'))

      // Small delay IBKR requires before fetching
      await new Promise(r => setTimeout(r, 2000))

      // Phase 2: fetch report using reference code
      const getRes = await fetch(`${PROXY_BASE}?action=get&t=${encodeURIComponent(token)}&q=${encodeURIComponent(refMatch[1])}`)
      if (!getRes.ok) throw new Error(t('errorFetchReport', { status: getRes.status }))
      const xml = await getRes.text()

      const data = parseFlexXml(xml)
      // Clear token from memory immediately
      setToken('')
      onData(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('errorFallback')
      onError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-2 border-blue-500 rounded-2xl p-6 bg-blue-50 dark:bg-blue-950">
      <div className="text-3xl mb-3">🔗</div>
      <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-1">{t('title')}</h3>
      <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
        {t('description', { year: taxYear })}
      </p>

      <div className="space-y-3">
        <div>
          <label htmlFor="flex-token" className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
            {t('tokenLabel')}
          </label>
          <input
            id="flex-token"
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder={t('tokenPlaceholder')}
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="flex-query-id" className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
            {t('queryIdLabel')}
          </label>
          <input
            id="flex-query-id"
            type="text"
            value={queryId}
            onChange={e => setQueryId(e.target.value)}
            placeholder={t('queryIdPlaceholder')}
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <details className="mt-3 text-xs text-blue-700 dark:text-blue-300">
        <summary className="cursor-pointer hover:underline font-semibold">{t('guideToggle')}</summary>
        <div className="mt-3 space-y-4 text-slate-700 dark:text-slate-300">

          <p className="text-slate-500 dark:text-slate-400 italic">
            {t('guideIntro')}
          </p>

          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{t('step1Title')}</p>
            <p>
              {t.rich('step1Body', {
                code: (chunks) => <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{chunks}</span>,
              })}
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{t('step2Title')}</p>
            <p>{t('step2Body')}</p>
          </div>

          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{t('step3Title')}</p>
            <p className="mb-1">{t('step3Intro')}</p>
            <ol className="list-decimal list-inside space-y-0.5 pl-2">
              <li>{t('step3Item1')}</li>
              <li>{t('step3Item2')}</li>
              <li>{t('step3Item3')}</li>
              <li>{t('step3Item4')}</li>
            </ol>
            <p className="mt-1 text-slate-500 dark:text-slate-400">{t('step3Note')}</p>
          </div>

          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{t('step4Title')}</p>
            <p>{t('step4Body', { year: taxYear })}</p>
          </div>

          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{t('step5Title')}</p>
            <p className="mb-1">{t('step5Intro')}</p>
            <ul className="list-disc list-inside space-y-0.5 pl-2">
              <li>{t('step5Item1')}</li>
              <li>{t('step5Item2')}</li>
            </ul>
            <p className="mt-1 text-slate-500 dark:text-slate-400">{t('step5Note')}</p>
          </div>

          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{t('step6Title')}</p>
            <ul className="list-disc list-inside space-y-0.5 pl-2">
              <li>{t('step6Item1')}</li>
              <li>{t('step6Item2')}</li>
              <li>{t('step6Item3')}</li>
            </ul>
            <div className="mt-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-2 text-amber-800 dark:text-amber-300 text-xs">
              {t('step6Warning', { year: taxYear })}
            </div>
          </div>

          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{t('step7Title')}</p>
            <p>
              {t.rich('step7Body', {
                code: (chunks) => <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{chunks}</span>,
              })}
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-2 text-amber-800 dark:text-amber-300">
            {t('securityTip')}
          </div>

        </div>
      </details>

      <button
        onClick={handleFetch}
        disabled={loading}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
      >
        {loading ? t('fetchingButton') : t('fetchButton')}
      </button>
    </div>
  )
}
