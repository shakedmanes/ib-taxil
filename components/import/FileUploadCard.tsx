'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { parseFlexXml } from '@/lib/ibkr/parser-xml'
import { ActivityStatementRejected } from '@/lib/ibkr/parser-csv'
import { looksLikeActivityStatement } from '@/lib/ibkr/detect'
import { FlexGuide } from './FlexGuide'
import type { IBKRData } from '@/lib/ibkr/types'

interface Props {
  onData: (data: IBKRData) => void
  onError?: (msg: string) => void
  taxYear?: number
}

export function FileUploadCard({ onData, onError, taxYear }: Props) {
  const t = useTranslations('fileUpload')
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [rejected, setRejected] = useState(false)

  const processFile = async (file: File) => {
    setRejected(false)
    try {
      const text = await file.text()
      // ADR-0003: Activity Statements lack per-lot detail — reject with guidance.
      if (looksLikeActivityStatement(text)) {
        setRejected(true)
        onError?.(new ActivityStatementRejected().message)
        return
      }
      const data = parseFlexXml(text)
      onData(data)
    } catch (err: unknown) {
      if (err instanceof ActivityStatementRejected) {
        setRejected(true)
        onError?.(err.message)
        return
      }
      const message = err instanceof Error ? err.message : t('errorUnknown')
      onError?.(t('errorParse', { message }))
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div className="border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-6 bg-white dark:bg-slate-900">
      <div className="text-3xl mb-3">📁</div>
      <h3 className="font-bold text-slate-900 dark:text-white mb-1">{t('title')}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('description')}</p>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-950'
            : 'border-slate-300 dark:border-slate-600 hover:border-blue-300'
        }`}
      >
        <p className="text-slate-400 text-sm">{t('dropHere')}</p>
        <p className="text-slate-300 text-xs mt-1">{t('orBrowse')}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".xml,.csv"
        aria-label={t('browseLabel')}
        onChange={onChange}
        className="hidden"
      />

      {rejected && (
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
          {t('rejected')}
        </div>
      )}

      <div className="mt-4">
        <FlexGuide taxYear={taxYear} defaultOpen={rejected} />
      </div>

      <p className="mt-3 text-xs text-slate-400">{t('accepted')}</p>
    </div>
  )
}
